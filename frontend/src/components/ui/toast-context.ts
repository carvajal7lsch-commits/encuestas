import { createContext, useContext } from 'react';

export interface ContextoToast {
  exito: (texto: string) => void;
  error: (texto: string) => void;
}

/**
 * Va en su propio archivo para que Toast.tsx exporte unicamente el componente:
 * mezclar componentes y utilidades en el mismo modulo rompe el fast refresh.
 */
export const ContextoAvisos = createContext<ContextoToast | null>(null);

export function useToast(): ContextoToast {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return contexto;
}
