import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { describe, it, expect } from 'vitest';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

describe('LandingPage', () => {
  it('renders every section of the landing', () => {
    const { container } = renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/no dependen de la señal/i);

    ['como-funciona', 'caracteristicas', 'smartmerge', 'arquitectura', 'faq'].forEach((id) => {
      expect(container.querySelector('#' + id)).not.toBeNull();
    });

    expect(screen.getByText(/Ficha 3142784/i)).toBeInTheDocument();
  });

  it('opens the APK modal from the hero call to action', () => {
    renderPage();

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /descargar apk/i })[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Android 8.0\+ \(API 26\)/i)).toBeInTheDocument();
  });

  it('expands a FAQ entry on click', () => {
    renderPage();

    const question = screen.getByRole('button', { name: /versiones de Android son compatibles/i });
    expect(question).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
  });
});
