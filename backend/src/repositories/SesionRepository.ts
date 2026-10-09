import { pool } from '../config/database';
import { Usuario } from '../types/auth.types';

export class SesionRepository {
  async crear(tokenHash: string, usuario: number, fingerprint: string, expiresAt: Date): Promise<void> {
    await pool.query('DELETE FROM sesiones_refresh WHERE expires_at <= NOW()');
    await pool.query(
      `INSERT INTO sesiones_refresh (token_hash, id_usuario, password_fingerprint, expires_at)
       VALUES ($1, $2, $3, $4)`, [tokenHash, usuario, fingerprint, expiresAt]
    );
  }

  async obtener(tokenHash: string): Promise<(Usuario & { password_fingerprint: string }) | null> {
    const result = await pool.query(
      `SELECT u.*, s.password_fingerprint FROM sesiones_refresh s
       JOIN usuarios u ON u.id_usuario = s.id_usuario
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.activo = TRUE`, [tokenHash]
    );
    return result.rows[0] ?? null;
  }

  async revocar(tokenHash: string): Promise<void> {
    await pool.query('DELETE FROM sesiones_refresh WHERE token_hash = $1', [tokenHash]);
  }
}
