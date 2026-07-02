const BASE_URL = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  login: async (numero_documento: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: numero_documento, password })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    return res.json();
  },

  getPersonas: async () => {
    const res = await fetch(`${BASE_URL}/admin/personas`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener personas');
    return res.json();
  },

  getUsuarios: async () => {
    const res = await fetch(`${BASE_URL}/admin/usuarios`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },

  createUsuario: async (userData: any) => {
    const res = await fetch(`${BASE_URL}/admin/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Error al crear usuario');
    return res.json();
  },

  toggleUsuario: async (id: number) => {
    const res = await fetch(`${BASE_URL}/admin/usuarios/${id}/toggle`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error al cambiar estado del usuario');
    return res.json();
  },

  getConflictos: async () => {
    const res = await fetch(`${BASE_URL}/admin/conflictos`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener conflictos');
    return res.json();
  },
  
  downloadReport: async () => {
    const res = await fetch(`${BASE_URL}/admin/reporte.csv`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al descargar el reporte. ' + (await res.text()));
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_encuestas.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
