import type { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Pinta la accion como destructiva (cerrar sesion, desactivar usuario). */
  peligroso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Reemplaza los window.confirm() del panel, que bloqueaban el hilo, no se
 * podian estilar y quedaban fuera del diseno del resto de la aplicacion.
 */
export default function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal
      titulo={titulo}
      onCerrar={onCancelar}
      ancho="sm"
      pie={
        <>
          <Button variante="secundario" onClick={onCancelar}>
            {textoCancelar}
          </Button>
          <Button variante={peligroso ? 'peligro' : 'primario'} onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p>{mensaje}</p>
    </Modal>
  );
}
