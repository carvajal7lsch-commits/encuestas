export interface Usuario {
  id_usuario: number;
  numero_documento: string;
  nombre_completo: string;
  email: string | null;
  password_hash: string;
  rol: 'encuestador' | 'supervisor' | 'admin';
  dispositivo_id: string | null;
  activo: boolean;
  creado_en: Date;
}

export interface JwtPayload {
  id_usuario: number;
  numero_documento: string;
  rol: string;
}
