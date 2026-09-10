import { useId } from 'react';
import { Search } from 'lucide-react';
import estilos from './SearchInput.module.css';

interface SearchInputProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
  /** Etiqueta real del campo; se oculta visualmente pero existe para el lector. */
  etiqueta: string;
}

/**
 * Buscador del panel. Los tres inputs que reemplaza solo tenian placeholder,
 * que no cuenta como nombre accesible.
 */
export default function SearchInput({
  valor,
  onCambio,
  placeholder = 'Buscar...',
  etiqueta,
}: SearchInputProps) {
  const id = useId();

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.etiqueta}>
        {etiqueta}
      </label>
      <Search size={16} className={estilos.icono} aria-hidden="true" />
      <input
        id={id}
        type="search"
        className={estilos.entrada}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onCambio(e.target.value)}
      />
    </div>
  );
}
