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
                    lc.id_log,
                    lc.id_encuesta_nueva,
                    lc.id_encuesta_previa,
                    lc.datos_anteriores,
                    lc.datos_entrantes,
                    lc.datos_resultado,
                    lc.campos_en_conflicto,
                    lc.estrategia,
                    -- Antes salia el id_usuario pelado.
                    r.nombre_completo AS resuelto_por,
                    lc.creado_en,
                    he.numero_documento,
                    p.nombres,
                    p.apellidos,
                    a.nombre_completo AS encuestador
                FROM log_conflictos lc
                LEFT JOIN usuarios r ON r.id_usuario = lc.resuelto_por
                LEFT JOIN historial_encuestas he ON he.id_encuesta = lc.id_encuesta_nueva
                LEFT JOIN personas p ON p.numero_documento = he.numero_documento
                LEFT JOIN usuarios a ON a.id_usuario = he.id_encuestador
                ORDER BY lc.creado_en DESC
                LIMIT 100
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
 * Serie diaria de encuestas sincronizadas y conflictos resueltos.
 *
 * Alimenta la grafica del resumen. Se usa generate_series para devolver todos
 * los dias del rango aunque no tengan actividad: si el frontend recibiera solo
 * los dias con datos, la grafica comprimiria los huecos y mentiria sobre el
 * ritmo real de sincronizacion.
 */
export const getSeriesDiaria = async (req: Request, res: Response): Promise<void> => {
    const solicitados = parseInt(String(req.query.dias ?? '30'), 10);
    // Se acota el rango para que nadie pida una serie de anos por la URL.
    const dias = Number.isFinite(solicitados) ? Math.min(Math.max(solicitados, 7), 365) : 30;

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT
                    to_char(d.dia, 'YYYY-MM-DD') AS dia,
                    COALESCE(e.total, 0)::int AS encuestas,
                    COALESCE(c.total, 0)::int AS conflictos
                FROM generate_series(
                    CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS d(dia)
                LEFT JOIN (
                    SELECT date_trunc('day', fecha_sincronizacion) AS dia, COUNT(*) AS total
                    FROM historial_encuestas
                    WHERE fecha_sincronizacion IS NOT NULL
                    GROUP BY 1
                ) e ON e.dia = d.dia
                LEFT JOIN (
                    SELECT date_trunc('day', creado_en) AS dia, COUNT(*) AS total
                    FROM log_conflictos
                    GROUP BY 1
                ) c ON c.dia = d.dia
                ORDER BY d.dia
            `, [dias]);

            res.status(200).json({ dias, serie: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching serie diaria:', error);
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
                `SELECT p.numero_documento, p.tipo_documento, p.nombres, p.apellidos,
                        p.telefono, p.email, p.direccion, p.eps, p.ocupacion, p.estrato,
                        p.sync_version, p.updated_at,
                        m.nombre AS municipio, m.departamento
                 FROM personas p
                 LEFT JOIN municipios m ON m.codigo = p.municipio_codigo
                 WHERE p.numero_documento = $1`,
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
                    he.dispositivo_id,
                    u.nombre_completo AS encuestador,
                    lc.id_log,
                    lc.campos_en_conflicto,
                    lc.estrategia,
                    lc.datos_anteriores,
                    lc.datos_entrantes,
                    lc.datos_resultado,
                    -- resuelto_por es un id_usuario; sin este JOIN la pantalla
                    -- mostraba un "4" pelado en lugar de un nombre.
                    r.nombre_completo AS resuelto_por,
                    (lc.id_log IS NOT NULL) AS tuvo_conflicto
                FROM historial_encuestas he
                LEFT JOIN usuarios u ON he.id_encuestador = u.id_usuario
                LEFT JOIN log_conflictos lc ON lc.id_encuesta_nueva = he.id_encuesta
                LEFT JOIN usuarios r ON r.id_usuario = lc.resuelto_por
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
                SELECT
                    p.numero_documento,
                    p.tipo_documento,
                    p.nombres,
                    p.apellidos,
                    p.telefono,
                    p.eps,
                    p.estrato,
                    p.municipio_codigo,
                    -- Antes se devolvia el codigo DIVIPOLA crudo y la pantalla
                    -- pintaba "41001" donde deberia decir "Neiva".
                    m.nombre AS municipio,
                    m.departamento,
                    p.sync_version,
                    p.updated_at,
                    COALESCE(e.versiones, 0)   AS versiones,
                    COALESCE(e.conflictos, 0)  AS conflictos,
                    e.ultima_encuesta,
                    e.ultimo_encuestador
                FROM personas p
                LEFT JOIN municipios m ON m.codigo = p.municipio_codigo
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(*) AS versiones,
                        COUNT(*) FILTER (
                            WHERE EXISTS (
                                SELECT 1 FROM log_conflictos lc
                                WHERE lc.id_encuesta_nueva = he.id_encuesta
                            )
                        ) AS conflictos,
                        MAX(he.fecha_encuesta) AS ultima_encuesta,
                        -- Quien tomo la version mas reciente: es la pregunta
                        -- que el admin hace primero al ver un registro raro.
                        (
                            SELECT u.nombre_completo
                            FROM historial_encuestas h2
                            LEFT JOIN usuarios u ON u.id_usuario = h2.id_encuestador
                            WHERE h2.numero_documento = p.numero_documento
                            ORDER BY h2.fecha_encuesta DESC
                            LIMIT 1
                        ) AS ultimo_encuestador
                    FROM historial_encuestas he
                    WHERE he.numero_documento = p.numero_documento
                ) e ON TRUE
                ORDER BY p.updated_at DESC
                LIMIT 200
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

/** Los tres roles que admite el CHECK de la tabla usuarios. */
const ROLES_VALIDOS = ['encuestador', 'supervisor', 'admin'];

/** Traduce la violacion de unicidad de Postgres al campo que la provoco. */
const mensajeDuplicado = (detail: string | undefined): string =>
    detail && detail.includes('email')
        ? 'Ya hay una cuenta con ese correo'
        : 'Ya hay una cuenta con ese documento';

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
    const { numero_documento, nombre_completo, password, rol, email, dispositivo_id } = req.body;

    if (!numero_documento || !nombre_completo || !password || !rol) {
        res.status(400).json({ error: 'El documento, el nombre, la contrasena y el rol son obligatorios' });
        return;
    }
    if (!ROLES_VALIDOS.includes(rol)) {
        res.status(400).json({ error: 'Rol no valido' });
        return;
    }
    if (String(password).length < 6) {
        res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
        return;
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            // email y dispositivo_id existen en el esquema desde el principio,
            // pero el alta nunca los enviaba: todo encuestador quedaba sin
            // correo y sin celular asignado.
            const result = await client.query(
                `INSERT INTO usuarios
                    (numero_documento, nombre_completo, email, password_hash, rol, dispositivo_id, activo)
                 VALUES ($1, $2, NULLIF($3, ''), $4, $5, NULLIF($6, ''), true)
                 RETURNING id_usuario, numero_documento, nombre_completo, email, rol, dispositivo_id, activo, creado_en`,
                [numero_documento, nombre_completo, email ?? '', passwordHash, rol, dispositivo_id ?? '']
            );
            res.status(201).json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: mensajeDuplicado(error.detail) });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Edicion de una cuenta. Faltaba por completo: el panel solo sabia crear y
 * encender/apagar, asi que un nombre mal escrito o un cambio de rol obligaba a
 * crear una cuenta nueva y abandonar la anterior.
 *
 * La contrasena no se toca aqui; tiene su propio endpoint para que un guardado
 * del formulario no la reescriba sin querer.
 */
export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { nombre_completo, email, rol, dispositivo_id } = req.body;

    if (!nombre_completo || !rol) {
        res.status(400).json({ error: 'El nombre y el rol son obligatorios' });
        return;
    }
    if (!ROLES_VALIDOS.includes(rol)) {
        res.status(400).json({ error: 'Rol no valido' });
        return;
    }

    // Quitarse a uno mismo el rol de admin deja el panel sin quien lo
    // administre, y al propio usuario fuera en cuanto vuelva a entrar.
    if (Number(id) === req.user?.id_usuario && rol !== 'admin') {
        res.status(400).json({ error: 'No puedes quitarte a ti mismo el rol de administrador' });
        return;
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE usuarios
                 SET nombre_completo = $1,
                     email           = NULLIF($2, ''),
                     rol             = $3,
                     dispositivo_id  = NULLIF($4, '')
                 WHERE id_usuario = $5
                 RETURNING id_usuario, numero_documento, nombre_completo, email, rol, dispositivo_id, activo, creado_en`,
                [nombre_completo, email ?? '', rol, dispositivo_id ?? '', id]
            );
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.status(200).json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error updating usuario:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: mensajeDuplicado(error.detail) });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/** Reasignacion de contrasena por un administrador. */
export const resetPasswordUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || String(password).length < 6) {
        res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
        return;
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2 RETURNING id_usuario',
                [passwordHash, id]
            );
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.status(200).json({ ok: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Baja definitiva, solo si la cuenta no dejo rastro.
 *
 * historial_encuestas.id_encuestador es NOT NULL y apunta aqui, y esa tabla es
 * inmutable por trigger: borrar a un encuestador que ya sincronizo encuestas
 * seria destruir la autoria de la auditoria. En ese caso la baja correcta es
 * desactivar, y el endpoint lo dice en lugar de fallar con un error de llave
 * foranea que no le explica nada a nadie.
 */
export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (Number(id) === req.user?.id_usuario) {
        res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        return;
    }

    try {
        const client = await pool.connect();
        try {
            const encuestas = await client.query(
                'SELECT COUNT(*)::int AS total FROM historial_encuestas WHERE id_encuestador = $1',
                [id]
            );
            const total: number = encuestas.rows[0].total;
            if (total > 0) {
                res.status(409).json({
                    error: `Esta cuenta firma ${total} encuesta(s) del historial y no se puede eliminar sin romper la auditoria. Desactivala en su lugar.`
                });
                return;
            }

            const result = await client.query(
                'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario',
                [id]
            );
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.status(200).json({ ok: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting usuario:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const toggleUsuario = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Desactivarse a uno mismo cierra la puerta desde dentro: la sesion sigue
    // viva hasta que caduque el token y despues no hay forma de volver a entrar.
    if (Number(id) === req.user?.id_usuario) {
        res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        return;
    }

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
