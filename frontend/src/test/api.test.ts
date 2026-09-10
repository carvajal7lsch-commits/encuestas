import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../services/api';
import { guardarSesion, leerToken, leerUsuario, cerrarSesion } from '../services/sesion';

const respuesta = (estado: number, cuerpo: unknown = {}) =>
  Promise.resolve(
    new Response(JSON.stringify(cuerpo), {
      status: estado,
      headers: { 'Content-Type': 'application/json' },
    })
  );

describe('services/sesion', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('con "Recuérdame" la sesión sobrevive en localStorage', () => {
    guardarSesion('tok-123', { nombre_completo: 'Ana' }, true);

    expect(localStorage.getItem('token')).toBe('tok-123');
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(leerUsuario().nombre_completo).toBe('Ana');
  });

  it('sin "Recuérdame" la sesión vive solo en sessionStorage', () => {
    // Antes el checkbox era decorativo: siempre se escribía en localStorage.
    guardarSesion('tok-456', { nombre_completo: 'Luis' }, false);

    expect(sessionStorage.getItem('token')).toBe('tok-456');
    expect(localStorage.getItem('token')).toBeNull();
    expect(leerToken()).toBe('tok-456');
  });

  it('cambiar de modo no deja dos sesiones conviviendo', () => {
    guardarSesion('viejo', {}, true);
    guardarSesion('nuevo', {}, false);

    expect(localStorage.getItem('token')).toBeNull();
    expect(leerToken()).toBe('nuevo');
  });

  it('cerrarSesion limpia los dos almacenes', () => {
    guardarSesion('tok', {}, true);
    cerrarSesion();
    expect(leerToken()).toBeNull();
    expect(leerUsuario()).toEqual({});
  });
});

describe('services/api', () => {
  const fetchOriginal = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    vi.restoreAllMocks();
  });

  it('adjunta el token guardado en la cabecera Authorization', async () => {
    guardarSesion('tok-abc', {}, true);
    // La firma explicita hace que mock.calls quede tipado como el fetch real.
    const espia = vi.fn((_url: RequestInfo | URL, _opciones?: RequestInit) =>
      respuesta(200, [])
    );
    globalThis.fetch = espia as unknown as typeof fetch;

    await api.getPersonas();

    const [, opciones] = espia.mock.calls[0];
    const cabeceras = (opciones?.headers ?? {}) as Record<string, string>;
    expect(cabeceras.Authorization).toBe('Bearer tok-abc');
  });

  it('una 401 cierra la sesión y avisa que expiró', async () => {
    guardarSesion('vencido', { nombre: 'Ana' }, true);
    globalThis.fetch = (() => respuesta(401, { error: 'Token inválido' })) as typeof fetch;

    await expect(api.getPersonas()).rejects.toThrow(/expiró/i);

    // Lo importante: la sesión no se queda a medias en el almacenamiento.
    expect(leerToken()).toBeNull();
    expect(leerUsuario()).toEqual({});
  });

  it('propaga el mensaje de error que manda el backend', async () => {
    globalThis.fetch = (() =>
      respuesta(409, { error: 'El usuario con ese documento ya existe' })) as typeof fetch;

    await expect(api.createUsuario({})).rejects.toThrow(
      'El usuario con ese documento ya existe'
    );
  });

  it('usa un mensaje de respaldo si el error no trae cuerpo legible', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response('vaya', { status: 500 }))) as typeof fetch;

    await expect(api.getConflictos()).rejects.toThrow('Error al obtener conflictos');
  });
});
