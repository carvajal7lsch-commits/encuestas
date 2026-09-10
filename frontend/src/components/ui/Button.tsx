import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './Button.module.css';

type Variante = 'primario' | 'secundario' | 'peligro';
type Tamano = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  children: ReactNode;
}

export default function Button({
  variante = 'primario',
  tamano = 'md',
  className = '',
  type = 'button',
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${estilos.boton} ${estilos[variante]} ${estilos[tamano]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}
