import type { ReactNode } from 'react';
import estilos from './Badge.module.css';

export type TonoBadge = 'neutro' | 'azul' | 'verde' | 'ambar' | 'violeta' | 'rojo';

interface BadgeProps {
  tono?: TonoBadge;
  children: ReactNode;
}

/**
 * Etiqueta corta para roles, estados y estrategias.
 *
 * La vista de conflictos pintaba `strategy-badge` y `strategy-${estrategia}`,
 * clases que no existian en ningun CSS: el badge se veia como texto plano.
 */
export default function Badge({ tono = 'neutro', children }: BadgeProps) {
  return <span className={`${estilos.badge} ${estilos[tono]}`}>{children}</span>;
}
