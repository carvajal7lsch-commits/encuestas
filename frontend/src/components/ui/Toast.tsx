import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { ContextoAvisos, type ContextoToast } from './toast-context';
import estilos from './Toast.module.css';

type TipoAviso = 'exito' | 'error';

interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

const DURACION_MS = 5000;

/**
 * Avisos no bloqueantes. Sustituyen a los alert() del panel, que congelaban la
 * pestana y eran el unico canal de error de la pantalla de usuarios.
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(0);

  const cerrar = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((a) => a.id !== id));
  }, []);

  const agregar = useCallback(
    (tipo: TipoAviso, texto: string) => {
      const id = siguienteId.current++;
      setAvisos((actuales) => [...actuales, { id, tipo, texto }]);
      window.setTimeout(() => cerrar(id), DURACION_MS);
    },
    [cerrar]
  );

  const valor = useMemo<ContextoToast>(
    () => ({
      exito: (texto: string) => agregar('exito', texto),
      error: (texto: string) => agregar('error', texto),
    }),
    [agregar]
  );

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      {/* role=status para que un lector de pantalla lo anuncie sin robar el foco. */}
      <div className={estilos.pila} role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`${estilos.aviso} ${estilos[aviso.tipo]}`}>
            {aviso.tipo === 'exito' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className={estilos.texto}>{aviso.texto}</span>
            <button
              type="button"
              className={estilos.cerrar}
              onClick={() => cerrar(aviso.id)}
              aria-label="Cerrar aviso"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  );
}
