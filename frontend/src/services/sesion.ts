/**
 * Sesion del panel administrativo.
 *
 * El checkbox "Recuerdame" del login era decorativo: se leia para pintar el
 * check pero la sesion siempre iba a localStorage. Aqui decide de verdad donde
 * vive:
 *   - marcado   -> localStorage, sobrevive al cierre del navegador
 *   - sin marcar -> sessionStorage, se borra al cerrar la pestana
 */

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'user';

export interface UsuarioSesion {
  id_usuario?: number;
  nombre_completo?: string;
  nombre?: string;
  rol?: string;
}

/** Acceso defensivo: en modo privado el navegador puede negar el almacenamiento. */
function leerDe(almacen: Storage, clave: string): string | null {
  try {
    return almacen.getItem(clave);
  } catch {
    return null;
  }
}

export function guardarSesion(token: string, usuario: unknown, recordar: boolean): void {
  const destino = recordar ? localStorage : sessionStorage;
  const otro = recordar ? sessionStorage : localStorage;

  try {
    // Se limpia el otro almacen para que no queden dos sesiones distintas.
    otro.removeItem(CLAVE_TOKEN);
    otro.removeItem(CLAVE_USUARIO);

    destino.setItem(CLAVE_TOKEN, token);
    destino.setItem(CLAVE_USUARIO, JSON.stringify(usuario ?? {}));
  } catch {
    /* Sin almacenamiento disponible la sesion dura lo que dure la pagina. */
  }
}

export function leerToken(): string | null {
  return leerDe(localStorage, CLAVE_TOKEN) ?? leerDe(sessionStorage, CLAVE_TOKEN);
}

export function leerUsuario(): UsuarioSesion {
  const crudo = leerDe(localStorage, CLAVE_USUARIO) ?? leerDe(sessionStorage, CLAVE_USUARIO);
  if (!crudo) return {};
  try {
    return JSON.parse(crudo) as UsuarioSesion;
  } catch {
    return {};
  }
}

export function cerrarSesion(): void {
  for (const almacen of [localStorage, sessionStorage]) {
    try {
      almacen.removeItem(CLAVE_TOKEN);
      almacen.removeItem(CLAVE_USUARIO);
    } catch {
      /* nada que limpiar */
    }
  }
}
