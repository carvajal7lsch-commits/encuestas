import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import estilos from './Modal.module.css';

export type AnchoModal = 'sm' | 'md' | 'lg';

interface ModalProps {
  titulo: string;
  /** Linea de apoyo bajo el titulo. */
  descripcion?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  /** Barra inferior de acciones. */
  pie?: ReactNode;
  /**
   * Cada pantalla pide el ancho que necesita. Antes la vista de auditoria
   * forzaba el suyo con un !important global que redimensionaba los modales
   * de todas las paginas.
   */
  ancho?: AnchoModal;
}

const FOCUSABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Dialogo accesible compartido por todo el panel.
 *
 * Antes cada pantalla tenia su propia estructura de modal y ninguna manejaba
 * teclado ni foco. Este componente reune lo que ya hacia bien
 * components/landing/ApkModal.tsx y agrega la trampa de foco.
 */
export default function Modal({
  titulo,
  descripcion,
  onCerrar,
  children,
  pie,
  ancho = 'md',
}: ModalProps) {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    // Se recuerda quien tenia el foco para devolverselo al cerrar.
    const anterior = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
        return;
      }

      if (e.key !== 'Tab' || !dialogoRef.current) return;

      // Trampa de foco: el tabulador no debe salirse del dialogo.
      // Se descartan los ocultos por semantica y no por medidas de layout:
      // offsetParent es null tambien en position:fixed y en cualquier entorno
      // sin motor de render, asi que no sirve como criterio de visibilidad.
      const focusables = Array.from(
        dialogoRef.current.querySelectorAll<HTMLElement>(FOCUSABLES)
      ).filter((el) => !el.hasAttribute('hidden') && !el.closest('[aria-hidden="true"]'));

      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alPulsarTecla);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = overflowPrevio;
      anterior?.focus?.();
    };
  }, [onCerrar]);

  return (
    <div className={estilos.fondo} onClick={onCerrar}>
      <div
        ref={dialogoRef}
        className={`${estilos.dialogo} ${estilos[ancho]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={estilos.cabecera}>
          <div>
            <h2 id={idTitulo} className={estilos.titulo}>{titulo}</h2>
            {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
          </div>
          <button
            ref={cerrarRef}
            type="button"
            className={estilos.cerrar}
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className={estilos.cuerpo}>{children}</div>

        {pie && <footer className={estilos.pie}>{pie}</footer>}
      </div>
    </div>
  );
}
