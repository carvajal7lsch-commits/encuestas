import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import { describe, it, expect } from 'vitest';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <LandingHeader />
    </MemoryRouter>
  );

describe('LandingHeader', () => {
  it('renders landing page brand name and links', () => {
    renderHeader();

    // Nombre de marca
    expect(screen.getByText('Encuestas')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Enlaces de navegación (presentes en el nav de escritorio y en el menú móvil)
    expect(screen.getAllByText('Características').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Smart Merge').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cómo funciona').length).toBeGreaterThan(0);

    // Botón de acceso administrador
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
  });

  it('toggles the mobile menu', () => {
    renderHeader();

    const toggle = screen.getByRole('button', { name: /abrir menú/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /cerrar menú/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
