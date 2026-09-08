import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Parser } from 'json2csv';
import bcrypt from 'bcrypt';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await pool.connect();
        
        try {
            // Total de encuestas
            const resultEncuestas = await client.query('SELECT COUNT(*) FROM historial_encuestas');
            const totalEncuestas = parseInt(resultEncuestas.rows[0].count, 10);

            // Total de personas únicas
            const resultPersonas = await client.query('SELECT COUNT(*) FROM personas');
            const totalPersonas = parseInt(resultPersonas.rows[0].count, 10);

            // Total de conflictos resueltos
            const resultConflictos = await client.query('SELECT COUNT(*) FROM log_conflictos');
            const totalConflictos = parseInt(resultConflictos.rows[0].count, 10);

            // Encuestadores habilitados para capturar en campo
            const resultEncuestadores = await client.query(
                "SELECT COUNT(*) FROM usuarios WHERE activo = TRUE AND rol = 'encuestador'"
            );
            const encuestadoresActivos = parseInt(resultEncuestadores.rows[0].count, 10);

            // Ultima subida recibida desde cualquier celular
            const resultUltima = await client.query(
                'SELECT MAX(fecha_sincronizacion) AS ultima FROM historial_encuestas'
            );
            const ultimaSincronizacion = resultUltima.rows[0].ultima;

            res.status(200).json({
                totalEncuestas,
                totalPersonas,
                totalConflictos,
                encuestadoresActivos,
                ultimaSincronizacion
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getConflictLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    id_log, 
                    id_encuesta_nueva, 
                    id_encuesta_previa, 
                    datos_anteriores, 
                    datos_entrantes, 
                    datos_resultado, 
                    campos_en_conflicto, 
                    estrategia, 
                    resuelto_por, 
                    creado_en 
                FROM log_conflictos 
                ORDER BY creado_en DESC 
                LIMIT 50
            `);
            res.status(200).json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching conflict logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

type TipoReporte = 'completo' | 'nuevos' | 'conflictos';

const TIPOS_VALIDOS: TipoReporte[] = ['completo', 'nuevos', 'conflictos'];

/**
 * Reporte CSV. La pantalla de Reportes ofrece tipo y rango de fechas; aqui se
 * traducen a filtros SQL reales — antes se ignoraban y siempre salia el mismo
 * volcado completo.
 */
export const downloadCsvReport = async (req: Request, res: Response): Promise<void> => {
    const tipoSolicitado = String(req.query.tipo || 'completo') as TipoReporte;
    const tipo: TipoReporte = TIPOS_VALIDOS.includes(tipoSolicitado) ? tipoSolicitado : 'completo';

    const desde = typeof req.query.desde === 'string' && req.query.desde ? req.query.desde : null;
    const hasta = typeof req.query.hasta === 'string' && req.query.hasta ? req.query.hasta : null;

    try {
        const client = await pool.connect();
        try {
            const condiciones: string[] = [];
            const valores: unknown[] = [];

            if (desde) {
                valores.push(desde);
                condiciones.push(`he.fecha_encuesta >= $${valores.length}`);
            }
            if (hasta) {
                // El input date entrega solo el dia: se incluye la jornada completa.
                valores.push(hasta);
                condiciones.push(`he.fecha_encuesta < ($${valores.length}::date + INTERVAL '1 day')`);
            }
            if (tipo === 'nuevos') {
                condiciones.push('he.es_actualizacion = FALSE');
            }
            if (tipo === 'conflictos') {
                condiciones.push(
                    'EXISTS (SELECT 1 FROM log_conflictos lc WHERE lc.id_encuesta_nueva = he.id_encuesta)'
                );
            }

            const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

            const result = await client.query(`
                SELECT
                    he.id_encuesta,
                    he.numero_documento,
                    p.nombres,
                    p.apellidos,
                    he.fecha_encuesta,
                    he.fecha_sincronizacion,
                    he.es_actualizacion,
                    he.datos_recolectados
                FROM historial_encuestas he
                JOIN personas p ON he.numero_documento = p.numero_documento
                ${where}
                ORDER BY he.fecha_sincronizacion DESC NULLS LAST
                LIMIT 5000
            `, valores);

            const records = result.rows.map(row => {
                const datos = row.datos_recolectados || {};
                return {
                    id_encuesta: row.id_encuesta,
                    documento: row.numero_documento,
                    nombre_completo: `${row.nombres} ${row.apellidos}`,
                    fecha_encuesta: row.fecha_encuesta,
                    fecha_sincronizacion: row.fecha_sincronizacion,
                    es_actualizacion: row.es_actualizacion ? 'SI' : 'NO',
                    // Aplanamos algunos campos comunes del JSON si existen
                    vacunas: datos.vacunas || 'N/A',
                    enfermedad: datos.enfermedad || 'N/A',
                    observaciones: datos.observaciones || 'N/A'
                };
            });

            // json2csv no puede inferir columnas de un arreglo vacio: se avisa
            // en vez de devolver un CSV roto.
            if (records.length === 0) {
                res.status(404).json({ error: 'No hay registros para los filtros seleccionados' });
                return;
            }

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(records);

            res.header('Content-Type', 'text/csv');
            res.attachment(`reporte_${tipo}.csv`);
            res.status(200).send(csv);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Historial inmutable de una persona: todas las versiones sincronizadas de sus
 * encuestas, de la mas reciente a la mas antigua.
 */
export const getHistorialPersona = async (req: Request, res: Response): Promise<void> => {
    const { documento } = req.params;

    try {
        const client = await pool.connect();
        try {
            const persona = await client.query(
                'SELECT numero_documento, nombres, apellidos FROM personas WHERE numero_documento = $1',
                [documento]
            );

            if (persona.rowCount === 0) {
                res.status(404).json({ error: 'Persona no encontrada' });
                return;
            }

            const historial = await client.query(`
                SELECT
                    he.id_encuesta,
                    he.datos_recolectados,
                    he.fecha_encuesta,
                    he.fecha_sincronizacion,
                    he.es_actualizacion,
                    he.version_anterior_id,
                    u.nombre_completo AS encuestador,
                    EXISTS (
                        SELECT 1 FROM log_conflictos lc WHERE lc.id_encuesta_nueva = he.id_encuesta
                    ) AS tuvo_conflicto
                FROM historial_encuestas he
                LEFT JOIN usuarios u ON he.id_encuestador = u.id_usuario
                WHERE he.numero_documento = $1
                ORDER BY he.fecha_encuesta DESC
            `, [documento]);

            res.status(200).json({
                persona: persona.rows[0],
                historial: historial.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching historial:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPersonas = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT numero_documento, nombres, apellidos, municipio_codigo as municipio, sync_version, updated_at
                FROM personas
                ORDER BY updated_at DESC
                LIMIT 100
            `);
            res.status(200).json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching personas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT id_usuario, numero_documento, nombre_completo, email, rol, activo, creado_en
                FROM usuarios
                ORDER BY creado_en DESC
            `);
            res.status(200).json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching usuarios:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
    const { numero_documento, nombre_completo, password, rol } = req.body;
    if (!numero_documento || !nombre_completo || !password || !rol) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO usuarios (numero_documento, nombre_completo, password_hash, rol, activo)
                 VALUES ($1, $2, $3, $4, true) RETURNING id_usuario, numero_documento, nombre_completo, rol, activo`,
                [numero_documento, nombre_completo, passwordHash, rol]
            );
            res.status(201).json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === '23505') { // unique violation
            res.status(409).json({ error: 'El usuario con ese documento ya existe' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const toggleUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE usuarios SET activo = NOT activo WHERE id_usuario = $1 RETURNING id_usuario, activo`,
                [id]
            );
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.status(200).json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error toggling usuario:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
