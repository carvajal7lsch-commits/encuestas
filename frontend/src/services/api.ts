const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Con el token vencido, todas las pantallas fallaban con un error genérico y el
 * panel quedaba inservible hasta limpiar el localStorage a mano. Ahora una 401
 * cierra la sesión y devuelve al login.
 */
const cerrarSesionPorTokenVencido = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/** Extrae el mensaje que manda el backend; si no hay, usa el de respaldo. */
const leerError = async (res: Response, respaldo: string): Promise<string> => {
  try {
    const cuerpo = await res.clone().json();
    return cuerpo?.error || cuerpo?.message || respaldo;
  } catch {
    return respaldo;
  }
};

const pedir = async (ruta: string, opciones: RequestInit = {}, respaldo = 'Error de conexión con el servidor') => {
  const res = await fetch(`${BASE_URL}${ruta}`, { headers: getHeaders(), ...opciones });

  if (res.status === 401) {
    cerrarSesionPorTokenVencido();
    throw new Error('Su sesión expiró. Vuelva a iniciar sesión.');
  }
  if (!res.ok) {
    throw new Error(await leerError(res, respaldo));
  }

  return res;
};

export const api = {
  login: async (numero_documento: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: numero_documento, password })
    });
    if (!res.ok) throw new Error(await leerError(res, 'Credenciales incorrectas o usuario inactivo'));
    return res.json();
  },

  getStats: async () => {
    const res = await pedir('/admin/stats', {}, 'Error al obtener las estadísticas');
    return res.json();
  },

  getPersonas: async () => {
    const res = await pedir('/admin/personas', {}, 'Error al obtener personas');
    return res.json();
  },

  getHistorialPersona: async (documento: string) => {
    const res = await pedir(
      `/admin/personas/${encodeURIComponent(documento)}/historial`,
      {},
      'Error al obtener el historial de la persona'
    );
    return res.json();
  },

  getUsuarios: async () => {
    const res = await pedir('/admin/usuarios', {}, 'Error al obtener usuarios');
    return res.json();
  },

  createUsuario: async (userData: unknown) => {
    const res = await pedir(
      '/admin/usuarios',
      { method: 'POST', body: JSON.stringify(userData) },
      'Error al crear usuario'
    );
    return res.json();
  },

  toggleUsuario: async (id: number) => {
    const res = await pedir(
      `/admin/usuarios/${id}/toggle`,
      { method: 'PUT' },
      'Error al cambiar estado del usuario'
    );
    return res.json();
  },

  getConflictos: async () => {
    const res = await pedir('/admin/conflictos', {}, 'Error al obtener conflictos');
    return res.json();
  },

  /** Descarga el CSV aplicando el tipo y el rango elegidos en la pantalla. */
  downloadReport: async (filtros: { tipo: string; desde?: string; hasta?: string }) => {
    const params = new URLSearchParams({ tipo: filtros.tipo });
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);

    const res = await pedir(`/admin/reporte.csv?${params}`, {}, 'Error al descargar el reporte');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${filtros.tipo}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
