import bcrypt from 'bcrypt';
import { pool } from '../config/database';

async function seed() {
  console.log('Iniciando seed de base de datos...');
  
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    
    const query = `
      INSERT INTO usuarios (numero_documento, nombre_completo, email, password_hash, rol, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (numero_documento) DO NOTHING
      RETURNING *;
    `;
    
    const values = [
      '1234567890',
      'Encuestador de Prueba',
      'prueba@Encuestas Offline.com',
      passwordHash,
      'encuestador',
      true
    ];
    
    const res = await pool.query(query, values);
    
    if (res.rows.length > 0) {
      console.log('Usuario de prueba creado exitosamente:');
      console.log(res.rows[0]);
    } else {
      console.log('El usuario de prueba ya existía en la base de datos.');
    }
  } catch (error) {
    console.error('Error durante el seed:', error);
  } finally {
    pool.end();
  }
}

seed();
