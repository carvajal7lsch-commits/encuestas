import estilos from './ResolucionConflicto.module.css';

/** Lo que el Smart Merge deja escrito para cada campo que chocó. */
export interface CampoEnConflicto {
  /** Lo que ya tenía el servidor. */
  valorA?: unknown;
  /** Lo que llegó del celular. */
  valorB?: unknown;
  /** 'A' o 'B': cuál de los dos quedó. */
  ganador?: string;
  /** Nombre interno de la regla que lo decidió. */
  reglaAplicada?: string;
}

interface Props {
  campos: Record<string, CampoEnConflicto> | null | undefined;
  /** Nombre de quien resolvió; el merge automático no tiene persona detrás. */
  resueltoPor?: string | null;
}

/**
 * Reglas del Smart Merge en castellano.
 *
 * El backend las guarda con su nombre de clase (ReglaDatoVsNull), que no le
 * dice nada a quien administra. Si aparece una regla nueva que no esté aquí se
 * muestra tal cual, en vez de ocultarla.
 */
const REGLAS: Record<string, string> = {
  ReglaDatoVsNull: 'Había dato de un lado y vacío del otro',
  ReglaUltimaFecha: 'Ganó la captura más reciente',
  ReglaMayorLongitud: 'Ganó el texto más completo',
  ReglaServidorGana: 'Se conservó lo del servidor',
};

/** Un vacío no es lo mismo que un dato: se dice, no se deja en blanco. */
function Valor({ valor, ganador }: { valor: unknown; ganador: boolean }) {
  const vacio = valor === null || valor === undefined || valor === '';
  return (
    <span className={`${estilos.valor} ${ganador ? estilos.ganador : ''} ${vacio ? estilos.vacio : ''}`}>
      {vacio ? 'sin dato' : String(valor)}
    </span>
  );
}

/**
 * Cómo se resolvió un conflicto, campo por campo.
 *
 * La pantalla anterior volcaba tres bloques de JSON crudo uno al lado del otro
 * (datos anteriores, entrantes y resultado) y dejaba que el administrador los
 * comparara a ojo. Toda la información que hace falta ya venía en
 * campos_en_conflicto: qué había a cada lado, cuál ganó y qué regla lo decidió.
 */
export default function ResolucionConflicto({ campos, resueltoPor }: Props) {
  const entradas = Object.entries(campos ?? {});
  if (entradas.length === 0) return null;

  return (
    <div className={estilos.caja}>
      <div className={estilos.encabezado}>
        <span className={estilos.titulo}>
          {entradas.length === 1
            ? 'Un campo entró en conflicto'
            : `${entradas.length} campos entraron en conflicto`}
        </span>
        <span className={estilos.autor}>
          Resuelto por {resueltoPor ?? 'el Smart Merge'}
        </span>
      </div>

      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Campo</th>
            <th scope="col">En el servidor</th>
            <th scope="col">Llegó del celular</th>
            <th scope="col">Quedó</th>
          </tr>
        </thead>
        <tbody>
          {entradas.map(([campo, detalle]) => {
            const ganaA = detalle.ganador === 'A';
            const regla = detalle.reglaAplicada
              ? (REGLAS[detalle.reglaAplicada] ?? detalle.reglaAplicada)
              : null;
            return (
              <tr key={campo}>
                <th scope="row" className={estilos.campo}>{campo}</th>
                <td><Valor valor={detalle.valorA} ganador={ganaA} /></td>
                <td><Valor valor={detalle.valorB} ganador={!ganaA} /></td>
                <td>
                  <span className={estilos.veredicto}>
                    {ganaA ? 'el del servidor' : 'el del celular'}
                  </span>
                  {regla && <span className={estilos.regla}>{regla}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
