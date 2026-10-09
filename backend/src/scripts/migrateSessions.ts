import { pool } from '../config/database';
import { migrateSessions } from '../config/sessionMigration';

async function run() {
  try {
    await migrateSessions();
    console.log('Migración de sesiones aplicada. Las encuestas no se modificaron.');
  } finally { await pool.end(); }
}
run().catch((error: NodeJS.ErrnoException) => {
  console.error('No se pudo aplicar la migración de sesiones:', error.code ?? error.message);
  process.exitCode = 1;
});
