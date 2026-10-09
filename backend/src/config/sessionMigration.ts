import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool } from './database';

/** Corre antes de listen; una transacción y un lock evitan arranques concurrentes. */
export async function migrateSessions(): Promise<void> {
  const sql = readFileSync(resolve(__dirname, '../../migrations/20261009_sesiones_refresh.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20261009)');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
