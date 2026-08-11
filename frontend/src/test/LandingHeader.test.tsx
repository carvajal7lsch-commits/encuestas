import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import { describe, it, expect } from 'vitest';

describe('LandingHeader', () => {
  it('renders landing page brand name and links', () => {
    render(
      <MemoryRouter>
        <LandingHeader />
      </MemoryRouter>
    );

    // Verify brand title is rendered
    expect(screen.getByText('Encuestas')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Verify navigation links
    expect(screen.getByText('Características')).toBeInTheDocument();
    expect(screen.getByText('Smart Merge')).toBeInTheDocument();

    // Verify admin access button
    expect(screen.getByRole('button')).toHaveTextContent(/Admin/);
  });
});
