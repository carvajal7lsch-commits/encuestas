// Prueba local de persistencia. Crea una cuenta temporal y elimina solo esa
// cuenta al terminar; no inserta ni modifica encuestas.
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import assert from 'node:assert/strict';
import { pool } from '../config/database';
import { AuthService } from '../services/AuthService';

async function run() {
  let userId: number | undefined;
  try {
    const document = 'test_' + randomBytes(6).toString('hex');
    const password = randomBytes(20).toString('hex');
    const result = await pool.query(
      `INSERT INTO usuarios (numero_documento, nombre_completo, password_hash, rol)
       VALUES ($1, 'Prueba temporal de sesión', $2, 'encuestador') RETURNING id_usuario`,
      [document, await bcrypt.hash(password, 10)]);
    userId = result.rows[0].id_usuario;
    const auth = new AuthService();
    const session = await auth.login(document, password, true);
    assert(session?.refreshToken);
    const refresh = session.refreshToken;
    assert(await auth.refresh(refresh));
    await pool.query('UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1', [userId]);
    assert.equal(await auth.refresh(refresh), null);
    await pool.query('UPDATE usuarios SET activo = TRUE WHERE id_usuario = $1', [userId]);
    assert(await auth.refresh(refresh));
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [await bcrypt.hash(password, 10), userId]);
    assert.equal(await auth.refresh(refresh), null);
    const next = await auth.login(document, password, true);
    assert(next?.refreshToken);
    await pool.query('UPDATE sesiones_refresh SET expires_at = NOW() - INTERVAL \'1 second\' WHERE id_usuario = $1', [userId]);
    assert.equal(await auth.refresh(next.refreshToken), null);
    const final = await auth.login(document, password, true);
    assert(final?.refreshToken);
    await auth.logout(final.refreshToken);
    assert.equal(await auth.refresh(final.refreshToken), null);
    await auth.logout(final.refreshToken);
    console.log('PostgreSQL: renovación, desactivación, contraseña, expiración y revocación verificadas.');
  } finally {
    if (userId !== undefined) await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [userId]);
    await pool.end();
  }
}
run().catch((error: NodeJS.ErrnoException) => {
  console.error('Verificación fallida:', error.code ?? error.message); process.exitCode = 1;
});
