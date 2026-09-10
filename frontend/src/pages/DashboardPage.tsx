import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useRecurso } from '../hooks/useRecurso';
import { formatearFechaCorta, formatearRelativo } from '../utils/fecha';
import { AreaChart, IconButton, PageHeader, type PuntoSerie } from '../components/ui';
import estilos from './DashboardPage.module.css';

interface Stats {
  totalEncuestas: number;
  totalPersonas: number;
  totalConflictos: number;
  encuestadoresActivos: number;
  ultimaSincronizacion: string | null;
}

interface Serie {
  dias: number;
  serie: { dia: string; encuestas: number; conflictos: number }[];
}

const RANGOS = [
  { dias: 7, texto: '7 días', periodo: 'en los últimos 7 días' },
  { dias: 30, texto: '30 días', periodo: 'en los últimos 30 días' },
  { dias: 90, texto: '90 días', periodo: 'en los últimos 90 días' },
];

/**
 * Resumen del sistema.
 *
 * Antes eran cuatro modulos apilados: cuatro tarjetas de color, la grafica con
 * sus filtros sueltos y una tarjeta entera dedicada a una fecha. Cada tarjeta
 * llevaba icono de color, borde de color, una frase de apoyo y su propio enlace
 * "Ver detalle", y los cuatro colores no codificaban nada: eran decoracion.
 *
 * Ahora hay una sola pieza. La grafica manda con su cifra protagonista, las
 * cuatro cuentas acumuladas caen debajo en una fila discreta separada por
 * filetes, y la fecha de la ultima sincronizacion se lee en la cabecera.
 */
export default function DashboardPage() {
  const navigate = useNavigate();

  // El rango vive en la URL: asi el enlace de un resumen concreto se puede
  // compartir y el boton atras del navegador funciona como se espera.
  const [params, setParams] = useSearchParams();
  const solicitado = Number(params.get('dias'));
  const rango = RANGOS.find((r) => r.dias === solicitado) ?? RANGOS[1];
  const setRango = (dias: number) => setParams({ dias: String(dias) }, { replace: true });

  const cargarStats = useCallback(() => api.getStats() as Promise<Stats>, []);
  const { datos, cargando, error, recargar } = useRecurso<Stats>(cargarStats);

  const cargarSerie = useCallback(() => api.getSeries(rango.dias) as Promise<Serie>, [rango.dias]);
  const serie = useRecurso<Serie>(cargarSerie, [rango.dias]);

  const puntos = useMemo<PuntoSerie[]>(
    () => (serie.datos?.serie ?? []).map((p) => ({ dia: p.dia, valor: p.encuestas })),
    [serie.datos]
  );

  const metricas = [
    {
      etiqueta: 'Encuestas',
      valor: datos?.totalEncuestas,
      ayuda: 'Versiones recibidas desde los celulares',
      destino: '/personas',
    },
    {
      etiqueta: 'Personas',
      valor: datos?.totalPersonas,
      ayuda: 'Ciudadanos únicos en la base consolidada',
      destino: '/personas',
    },
    {
      etiqueta: 'Conflictos',
      valor: datos?.totalConflictos,
      ayuda: 'Fusiones aplicadas por el Smart Merge',
      destino: '/conflictos',
    },
    {
      etiqueta: 'Encuestadores',
      valor: datos?.encuestadoresActivos,
      ayuda: 'Cuentas habilitadas para capturar en campo',
      destino: '/usuarios',
    },
  ];

  const ultima = cargando
    ? 'Consultando el estado de la operación…'
    : error
      ? 'No se pudo consultar el estado de la operación'
      : datos?.ultimaSincronizacion
        ? `Última sincronización ${formatearRelativo(datos.ultimaSincronizacion)} · ${formatearFechaCorta(datos.ultimaSincronizacion)}`
        : 'Todavía no se ha recibido ninguna sincronización';

  const controles = (
    <div className={estilos.rangos} role="group" aria-label="Rango de la gráfica">
      {RANGOS.map((opcion) => (
        <button
          key={opcion.dias}
          type="button"
          className={`${estilos.rango} ${rango.dias === opcion.dias ? estilos.rangoActivo : ''}`}
          onClick={() => setRango(opcion.dias)}
          aria-pressed={rango.dias === opcion.dias}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  );

  return (
    <div className={estilos.pagina}>
      <PageHeader
        titulo="Resumen del sistema"
        subtitulo={ultima}
        acciones={
          <IconButton
            etiqueta="Actualizar datos"
            onClick={() => {
              recargar();
              serie.recargar();
            }}
            disabled={cargando || serie.cargando}
          >
            <RefreshCcw
              size={16}
              className={cargando || serie.cargando ? estilos.girando : undefined}
            />
          </IconButton>
        }
      />

      {error && (
        <p className={estilos.error} role="alert">
          <AlertTriangle size={16} aria-hidden="true" /> {error}
        </p>
      )}

      <section className={estilos.panel} aria-label="Actividad de sincronización">
        {serie.cargando ? (
          <div className={estilos.cargando}>Cargando la serie…</div>
        ) : serie.error ? (
          <p className={estilos.error} role="alert">
            <AlertTriangle size={16} aria-hidden="true" /> {serie.error}
          </p>
        ) : (
          <AreaChart
            plano
            titulo="Encuestas sincronizadas por día"
            unidad="encuestas"
            periodo={rango.periodo}
            acciones={controles}
            puntos={puntos}
          />
        )}

        <div className={estilos.tira}>
          <span className={estilos.tiraTitulo}>Acumulado histórico</span>
          <div className={estilos.metricas}>
            {metricas.map((metrica) => {
              const valor = cargando || error ? '—' : (metrica.valor ?? 0).toLocaleString();
              return (
                <button
                  key={metrica.etiqueta}
                  type="button"
                  className={estilos.metrica}
                  onClick={() => navigate(metrica.destino)}
                  /* La frase de apoyo ya no ocupa sitio en pantalla, pero sigue
                     estando para quien navega con lector. */
                  aria-label={`${metrica.etiqueta}: ${valor}. ${metrica.ayuda}. Ver detalle.`}
                >
                  <span className={estilos.metricaValor}>{valor}</span>
                  <span className={estilos.metricaEtiqueta}>{metrica.etiqueta}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
