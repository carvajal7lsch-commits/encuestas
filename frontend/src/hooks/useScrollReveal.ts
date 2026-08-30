import type { CSSProperties } from 'react';
import { useEffect } from 'react';

/**
 * Revela progresivamente los elementos marcados con la clase `l-reveal`
 * a medida que entran en el viewport. Si el navegador (o el entorno de
 * pruebas) no soporta IntersectionObserver, todo se muestra de inmediato.
 */
export function useScrollReveal(selector = '.l-reveal') {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);
}

export default useScrollReveal;

/**
 * Retardo escalonado para animar en cascada varios elementos `l-reveal`.
 */
export const revealDelay = (ms: number): CSSProperties =>
  ({ '--l-delay': ms + 'ms' } as CSSProperties);
