import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import DataTable, { type Columna } from '../components/ui/DataTable';

afterEach(cleanup);

interface Fila {
  id: string;
  nombre: string;
}

const columnas: Columna<Fila>[] = [
  { clave: 'id', encabezado: 'Documento', celda: (f) => f.id },
  { clave: 'nombre', encabezado: 'Nombre', celda: (f) => f.nombre },
];

const pintar = (props: Partial<Parameters<typeof DataTable<Fila>>[0]> = {}) =>
  render(
    <DataTable<Fila>
      etiqueta="Personas encuestadas"
      columnas={columnas}
      filas={[]}
      claveFila={(f) => f.id}
      {...props}
    />
  );

describe('DataTable', () => {
  it('distingue el estado vacío del estado de error', () => {
    // Esta era la regresión real: dos pantallas se comían el fallo de red con
    // un console.error y mostraban el mismo "no hay datos" que una lista vacía.
    pintar({ vacio: 'No hay datos registrados' });
    expect(screen.getByText('No hay datos registrados')).toBeInTheDocument();

    cleanup();

    pintar({ error: 'Error al obtener personas' });
    expect(screen.getByText('Error al obtener personas')).toBeInTheDocument();
    expect(screen.queryByText('No hay datos registrados')).not.toBeInTheDocument();
  });

  it('el estado de carga tiene prioridad sobre el vacío', () => {
    pintar({ cargando: true, vacio: 'No hay datos registrados' });

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('No hay datos registrados')).not.toBeInTheDocument();
  });

  it('el error tiene prioridad sobre las filas viejas en pantalla', () => {
    pintar({
      filas: [{ id: '123', nombre: 'Ana' }],
      error: 'Su sesión expiró',
    });

    expect(screen.getByText('Su sesión expiró')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
  });

  it('renderiza las filas con encabezados accesibles', () => {
    pintar({ filas: [{ id: '123', nombre: 'Ana' }] });

    expect(screen.getByRole('table', { name: 'Personas encuestadas' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Documento' })).toHaveAttribute(
      'scope',
      'col'
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('una fila clicable se puede activar con teclado', () => {
    const onFilaClick = vi.fn();
    pintar({ filas: [{ id: '123', nombre: 'Ana' }], onFilaClick });

    const fila = screen.getByRole('button');
    expect(fila).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(fila, { key: 'Enter' });
    expect(onFilaClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(fila, { key: ' ' });
    expect(onFilaClick).toHaveBeenCalledTimes(2);
  });

  it('sin onFilaClick las filas no son interactivas', () => {
    pintar({ filas: [{ id: '123', nombre: 'Ana' }] });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
