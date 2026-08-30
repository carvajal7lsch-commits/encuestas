import '@testing-library/jest-dom';

// jsdom no implementa matchMedia; el header de la landing lo usa para
// cerrar el menú móvil al volver a viewport de escritorio.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
