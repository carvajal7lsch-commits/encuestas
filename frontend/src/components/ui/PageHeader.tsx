import type { ReactNode } from 'react';
import estilos from './PageHeader.module.css';

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  /** Controles alineados a la derecha: busqueda, filtros, acciones. */
  acciones?: ReactNode;
}

/** Cabecera comun de las pantallas del panel; antes estaba copiada 4 veces. */
export default function PageHeader({ titulo, subtitulo, acciones }: PageHeaderProps) {
  return (
    <header className={estilos.cabecera}>
      <div className={estilos.textos}>
        <h1 className={estilos.titulo}>{titulo}</h1>
        {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
      </div>
      {acciones && <div className={estilos.acciones}>{acciones}</div>}
    </header>
  );
}
