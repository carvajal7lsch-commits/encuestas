import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  console.log('🌱 Ejecutando seed de usuarios...');
  
  const client = await pool.connect();
  
  try {
    // Check if admin exists
    const res = await client.query('SELECT * FROM usuarios WHERE numero_documento = $1', ['admin']);
    const passwordHash = await bcrypt.hash('123456', 10);
    if (res.rows.length > 0) {
      await client.query('UPDATE usuarios SET password_hash = $1 WHERE numero_documento = $2', [passwordHash, 'admin']);
      console.log('El usuario admin ya existe. Contraseña actualizada forzosamente a: 123456');
    } else {
      await client.query(
        `INSERT INTO usuarios (numero_documento, nombre_completo, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, true)`,
        ['admin', 'Super Administrador', passwordHash, 'supervisor']
      );
      console.log('✅ Usuario admin creado con éxito.');
      console.log('Credenciales de acceso:');
      console.log('Documento: admin');
      console.log('Password:  123456');
    }
    
    // Check if test encuestador exists
    const res2 = await client.query('SELECT * FROM usuarios WHERE numero_documento = $1', ['998877']);
    if (res2.rows.length === 0) {
      const passwordHash = await bcrypt.hash('123456', 10);
      await client.query(
        `INSERT INTO usuarios (numero_documento, nombre_completo, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, true)`,
        ['998877', 'Encuestador de Prueba', passwordHash, 'encuestador']
      );
      console.log('✅ Usuario encuestador (998877) creado.');
    }
  } catch (err) {
    console.error('❌ Error ejecutando seed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runSeed();
