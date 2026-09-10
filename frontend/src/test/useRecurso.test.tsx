import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { useRecurso } from '../hooks/useRecurso';

afterEach(cleanup);

/** Sonda mínima que expone el estado del hook como texto. */
function Sonda({ cargar }: { cargar: () => Promise<string[]> }) {
  const { datos, cargando, error, recargar } = useRecurso<string[]>(cargar);

  return (
    <div>
      <span data-testid="estado">
        {cargando ? 'cargando' : error ? `error: ${error}` : `datos: ${datos?.join(',')}`}
      </span>
      <button type="button" onClick={recargar}>
        Recargar
      </button>
    </div>
  );
}

describe('useRecurso', () => {
  it('expone los datos cuando la petición funciona', async () => {
    render(<Sonda cargar={() => Promise.resolve(['ana', 'luis'])} />);

    expect(screen.getByTestId('estado')).toHaveTextContent('cargando');
    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('datos: ana,luis');
    });
  });

  it('expone el mensaje de error en vez de tragárselo', async () => {
    // El comportamiento anterior era catch { console.error(err) }: la pantalla
    // no se enteraba y mostraba una tabla vacía.
    render(<Sonda cargar={() => Promise.reject(new Error('Error al obtener usuarios'))} />);

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('error: Error al obtener usuarios');
    });
  });

  it('da un mensaje genérico si lo rechazado no es un Error', async () => {
    render(<Sonda cargar={() => Promise.reject('vaya')} />);

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('error:');
    });
  });

  it('no deja estado de error pegado tras una recarga exitosa', async () => {
    let debeFallar = true;
    const cargar = () =>
      debeFallar
        ? Promise.reject(new Error('sin red'))
        : Promise.resolve(['ana']);

    render(<Sonda cargar={cargar} />);

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('error: sin red');
    });

    debeFallar = false;
    screen.getByRole('button', { name: 'Recargar' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('estado')).toHaveTextContent('datos: ana');
    });
  });
});
