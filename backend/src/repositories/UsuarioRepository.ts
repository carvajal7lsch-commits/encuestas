import { pool } from '../config/database';
import { Usuario } from '../types/auth.types';

export class UsuarioRepository {
  async obtenerPorCredencial(identificador: string): Promise<Usuario | null> {
    const query = `
      SELECT * 
      FROM usuarios 
      WHERE (email = $1 OR numero_documento = $1) 
      AND activo = true
    `;
    const result = await pool.query(query, [identificador]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as Usuario;
  }
}
