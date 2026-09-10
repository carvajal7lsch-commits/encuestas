import { useId, useMemo, useState, type ReactNode } from 'react';
import estilos from './AreaChart.module.css';

export interface PuntoSerie {
  /** Fecha ISO (YYYY-MM-DD). */
  dia: string;
  valor: number;
}

interface AreaChartProps {
  puntos: PuntoSerie[];
  /** Nombra la serie: con una sola serie el titulo sustituye a la leyenda. */
  titulo: string;
  /** Unidad para el tooltip ("encuestas", "conflictos"). */
  unidad: string;
  /** Texto que acompana al total: "en los ultimos 30 dias". */
  periodo?: string;
  /**
   * Controles del rango. Van en la misma fila del titulo, encima del lienzo, y
   * se dibujan tambien cuando no hay actividad: si desaparecieran justo ahi no
   * habria forma de ampliar el rango para encontrar datos.
   */
  acciones?: ReactNode;
  /** Sin marco propio, para anidarla en un panel que ya lo tiene. */
  plano?: boolean;
  alto?: number;
}

const ANCHO = 720;
const MARGEN = { arriba: 14, derecha: 10, abajo: 22, izquierda: 34 };

const formatearDia = (iso: string) => {
  const f = new Date(`${iso}T00:00:00`);
  return Number.isNaN(f.getTime())
    ? iso
    : f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

/**
 * Area de una sola serie con crosshair y tooltip.
 *
 * Una sola serie no lleva leyenda: el titulo la nombra. Tampoco lleva una
 * etiqueta por punto, solo los extremos del eje y el maximo, para que las
 * marcas no compitan con los datos.
 */
export default function AreaChart({
  puntos,
  titulo,
  unidad,
  periodo = 'en el periodo',
  acciones,
  plano = false,
  alto = 200,
}: AreaChartProps) {
  const idGradiente = useId();
  const [activo, setActivo] = useState<number | null>(null);

  const geometria = useMemo(() => {
    // Una serie entera en cero no es una linea plana pegada al eje: es
    // ausencia de actividad, y decirlo con palabras informa mas que dibujarla.
    if (puntos.length === 0 || puntos.every((p) => p.valor === 0)) return null;

    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;
    const maximo = Math.max(...puntos.map((p) => p.valor), 1);

    const x = (i: number) =>
      MARGEN.izquierda +
      (puntos.length === 1 ? anchoUtil / 2 : (i * anchoUtil) / (puntos.length - 1));
    const y = (v: number) => MARGEN.arriba + altoUtil - (v / maximo) * altoUtil;

    const coords = puntos.map((p, i) => ({ x: x(i), y: y(p.valor), ...p }));
    const linea = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
    const area =
      `${linea} L${coords[coords.length - 1].x},${MARGEN.arriba + altoUtil}` +
      ` L${coords[0].x},${MARGEN.arriba + altoUtil} Z`;

    // Solo tres marcas en el eje Y: mas que eso compite con los datos.
    const marcasY = [0, Math.round(maximo / 2), maximo]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((v) => ({ valor: v, y: y(v) }));

    return { coords, linea, area, maximo, marcasY, altoUtil };
  }, [puntos, alto]);

  const total = puntos.reduce((suma, p) => suma + p.valor, 0);
  const punto = geometria && activo !== null ? geometria.coords[activo] : null;

  return (
    <figure className={`${estilos.figura} ${plano ? estilos.plano : ''}`}>
      <figcaption className={estilos.cabecera}>
        <div className={estilos.identidad}>
          <span className={estilos.titulo}>{titulo}</span>
          <span className={estilos.total}>
            {total.toLocaleString()} <span>{periodo}</span>
          </span>
        </div>
        {acciones && <div className={estilos.acciones}>{acciones}</div>}
      </figcaption>

      {!geometria ? (
        <p className={estilos.vacio}>Sin actividad en el rango seleccionado</p>
      ) : (
        <>
          <div className={estilos.lienzo}>
            <svg
              viewBox={`0 0 ${ANCHO} ${alto}`}
              className={estilos.svg}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${titulo}. ${total} ${unidad} ${periodo}.`}
              onMouseLeave={() => setActivo(null)}
              onMouseMove={(e) => {
                const caja = e.currentTarget.getBoundingClientRect();
                const relativo = ((e.clientX - caja.left) / caja.width) * ANCHO;
                let cercano = 0;
                let distancia = Infinity;
                geometria.coords.forEach((c, i) => {
                  const d = Math.abs(c.x - relativo);
                  if (d < distancia) {
                    distancia = d;
                    cercano = i;
                  }
                });
                setActivo(cercano);
              }}
            >
              <defs>
                <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-mark)" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="var(--chart-mark)" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Rejilla recesiva */}
              {geometria.marcasY.map((marca) => (
                <line
                  key={marca.valor}
                  x1={MARGEN.izquierda}
                  x2={ANCHO - MARGEN.derecha}
                  y1={marca.y}
                  y2={marca.y}
                  className={estilos.rejilla}
                />
              ))}

              <path d={geometria.area} fill={`url(#${idGradiente})`} />
              <path d={geometria.linea} className={estilos.linea} />

              {/* Crosshair y marcador del punto activo */}
              {punto && (
                <>
                  <line
                    x1={punto.x}
                    x2={punto.x}
                    y1={MARGEN.arriba}
                    y2={MARGEN.arriba + geometria.altoUtil}
                    className={estilos.crosshair}
                  />
                  {/* Anillo del color de la superficie: separa la marca del area */}
                  <circle cx={punto.x} cy={punto.y} r="5.5" className={estilos.marcadorAnillo} />
                  <circle cx={punto.x} cy={punto.y} r="3.5" className={estilos.marcador} />
                </>
              )}
            </svg>

            {/* Etiquetas fuera del SVG: el preserveAspectRatio="none" deformaria el texto. */}
            <div className={estilos.ejeY} aria-hidden="true">
              {geometria.marcasY
                .slice()
                .reverse()
                .map((marca) => (
                  <span key={marca.valor} style={{ top: `${(marca.y / alto) * 100}%` }}>
                    {marca.valor}
                  </span>
                ))}
            </div>

            <div className={estilos.ejeX} aria-hidden="true">
              <span>{formatearDia(puntos[0].dia)}</span>
              <span>{formatearDia(puntos[puntos.length - 1].dia)}</span>
            </div>

            {punto && (
              <div
                className={estilos.tooltip}
                style={{ left: `${(punto.x / ANCHO) * 100}%` }}
                role="status"
              >
                <span className={estilos.tooltipFecha}>{formatearDia(punto.dia)}</span>
                <span className={estilos.tooltipValor}>
                  {punto.valor} {unidad}
                </span>
              </div>
            )}
          </div>

          {/* Vista de tabla: la identidad de los datos no puede depender del
              color ni del hover. Va colapsada para no competir con la grafica. */}
          <details className={estilos.tabla}>
            <summary>Ver los datos como tabla</summary>
            <div className={estilos.tablaCaja}>
              <table>
                <caption>{titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Día</th>
                    <th scope="col">{unidad}</th>
                  </tr>
                </thead>
                <tbody>
                  {puntos.map((p) => (
                    <tr key={p.dia}>
                      <td>{formatearDia(p.dia)}</td>
                      <td>{p.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}
