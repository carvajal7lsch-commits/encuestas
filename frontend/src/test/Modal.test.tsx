import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Modal from '../components/ui/Modal';

afterEach(cleanup);

describe('Modal', () => {
  it('se anuncia como diálogo y toma su nombre del título', () => {
    render(
      <Modal titulo="Detalle del conflicto" onCerrar={() => {}}>
        <p>contenido</p>
      </Modal>
    );

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleName('Detalle del conflicto');
  });

  it('cierra con la tecla Escape', () => {
    const onCerrar = vi.fn();

    render(
      <Modal titulo="Historial" onCerrar={onCerrar}>
        <p>contenido</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('cierra al hacer clic fuera pero no al hacerlo dentro', () => {
    const onCerrar = vi.fn();

    render(
      <Modal titulo="Historial" onCerrar={onCerrar}>
        <p>contenido interno</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('contenido interno'));
    expect(onCerrar).not.toHaveBeenCalled();

    // El fondo es el padre del diálogo.
    const fondo = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.click(fondo);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('pone el foco inicial en el botón de cerrar', () => {
    render(
      <Modal titulo="Historial" onCerrar={() => {}}>
        <button type="button">Interno</button>
      </Modal>
    );

    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('atrapa el foco: desde el último elemento el tabulador vuelve al primero', () => {
    render(
      <Modal titulo="Historial" onCerrar={() => {}} pie={<button type="button">Guardar</button>}>
        <button type="button">Interno</button>
      </Modal>
    );

    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    const guardar = screen.getByRole('button', { name: 'Guardar' });

    guardar.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(cerrar).toHaveFocus();

    // Y hacia atrás desde el primero se va al último.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(guardar).toHaveFocus();
  });

  it('bloquea el scroll del body mientras está abierto y lo restaura al cerrar', () => {
    const { unmount } = render(
      <Modal titulo="Historial" onCerrar={() => {}}>
        <p>contenido</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('cada ancho es independiente: uno no puede imponer el del otro', () => {
    // Regresión: un .modal-content con !important en la hoja de una pantalla
    // redimensionaba los modales de todas las demás.
    const { container: chico } = render(
      <Modal titulo="Chico" onCerrar={() => {}} ancho="sm">
        <p>a</p>
      </Modal>
    );
    const claseChico = chico.querySelector('[role="dialog"]')!.className;

    cleanup();

    const { container: grande } = render(
      <Modal titulo="Grande" onCerrar={() => {}} ancho="lg">
        <p>b</p>
      </Modal>
    );
    const claseGrande = grande.querySelector('[role="dialog"]')!.className;

    expect(claseChico).not.toBe(claseGrande);
  });
});
