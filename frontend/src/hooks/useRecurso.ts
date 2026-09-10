import { useCallback, useEffect, useState } from 'react';

interface EstadoRecurso<T> {
  datos: T | null;
  cargando: boolean;
  error: string;
  recargar: () => void;
}

/**
 * Carga un recurso de la API y expone su estado.
 *
 * Cada pantalla del panel repetia este mismo bloque, y dos de ellas se comian
 * el fallo con un console.error: al caerse la red mostraban "no hay datos", asi
 * que un error de conexion era indistinguible de una lista vacia. Aqui el error
 * siempre queda disponible para la interfaz.
 */
export function useRecurso<T>(
  cargar: () => Promise<T>,
  deps: unknown[] = []
): EstadoRecurso<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(cargar, deps);

  const [recarga, setRecarga] = useState(0);
  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    let vigente = true;

    setCargando(true);
    setError('');

    ejecutar()
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar la informacion');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    // Evita escribir estado si la pantalla se desmonto durante la peticion.
    return () => {
      vigente = false;
    };
  }, [ejecutar, recarga]);

  return { datos, cargando, error, recargar };
}
