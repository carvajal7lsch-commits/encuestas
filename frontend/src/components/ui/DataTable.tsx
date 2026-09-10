import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import estilos from './DataTable.module.css';

export interface Columna<T> {
  clave: string;
  encabezado: string;
  /** Alinea la columna a la derecha (acciones, cifras). */
  derecha?: boolean;
  celda: (fila: T) => ReactNode;
}

interface DataTableProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (fila: T) => string;
  cargando?: boolean;
  error?: string;
  /** Texto cuando la consulta funciono pero no devolvio nada. */
  vacio?: string;
  /** Descripcion accesible de la tabla. */
  etiqueta: string;
  onFilaClick?: (fila: T) => void;
  /** Marca la fila abierta en una vista maestro-detalle. */
  filaActiva?: (fila: T) => boolean;
}

/**
 * Tabla compartida por el panel.
 *
 * Encapsula los tres estados que antes cada pantalla resolvia por su cuenta —y
 * dos de ellas ni siquiera distinguian: si la peticion fallaba, mostraban el
 * mismo "no hay datos" que una lista legitimamente vacia.
 */
export default function DataTable<T>({
  columnas,
  filas,
  claveFila,
  cargando = false,
  error,
  vacio = 'No hay datos registrados',
  etiqueta,
  onFilaClick,
  filaActiva,
}: DataTableProps<T>) {
  const mensaje = (contenido: ReactNode, modificador?: string) => (
    <tr>
      <td colSpan={columnas.length} className={`${estilos.mensaje} ${modificador ?? ''}`}>
        {contenido}
      </td>
    </tr>
  );

  return (
    <div className={estilos.contenedor}>
      <table className={estilos.tabla}>
        <caption className={estilos.leyenda}>{etiqueta}</caption>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                className={columna.derecha ? estilos.derecha : undefined}
              >
                {columna.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando
            ? mensaje('Cargando...')
            : error
              ? mensaje(
                  <span className={estilos.contenidoMensaje}>
                    <AlertTriangle size={16} /> {error}
                  </span>,
                  estilos.error
                )
              : filas.length === 0
                ? mensaje(
                    <span className={estilos.contenidoMensaje}>
                      <Inbox size={16} /> {vacio}
                    </span>
                  )
                : filas.map((fila) => {
                    const clicable = Boolean(onFilaClick);
                    const activa = filaActiva?.(fila) ?? false;
                    return (
                      <tr
                        key={claveFila(fila)}
                        className={`${clicable ? estilos.clicable : ''} ${activa ? estilos.activa : ''}`}
                        // aria-current: sin esto, un lector no sabria cual de
                        // las filas es la que esta abierta al lado.
                        aria-current={activa ? 'true' : undefined}
                        // Una fila clicable tiene que poder abrirse con teclado:
                        // la vista de conflictos solo respondia al raton.
                        tabIndex={clicable ? 0 : undefined}
                        role={clicable ? 'button' : undefined}
                        onClick={clicable ? () => onFilaClick?.(fila) : undefined}
                        onKeyDown={
                          clicable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onFilaClick?.(fila);
                                }
                              }
                            : undefined
                        }
                      >
                        {columnas.map((columna) => (
                          <td
                            key={columna.clave}
                            className={columna.derecha ? estilos.derecha : undefined}
                          >
                            {columna.celda(fila)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
        </tbody>
      </table>
    </div>
  );
}
