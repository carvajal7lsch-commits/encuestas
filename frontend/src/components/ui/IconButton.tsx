import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './IconButton.module.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /**
   * Obligatorio a proposito: los botones solo-icono del panel se anunciaban
   * como botones vacios en un lector de pantalla. El tipo ya no lo permite.
   */
  etiqueta: string;
  children: ReactNode;
  tamano?: 'sm' | 'md';
}

export default function IconButton({
  etiqueta,
  children,
  tamano = 'md',
  className = '',
  type = 'button',
  ...resto
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`${estilos.boton} ${estilos[tamano]} ${className}`}
      aria-label={etiqueta}
      title={etiqueta}
      {...resto}
    >
      {children}
    </button>
  );
}
