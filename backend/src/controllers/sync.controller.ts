import { Request, Response } from 'express';
import { pool } from '../config/database';
import { SmartMergeService } from '../services/smartMerge/smartMerge.service';

const smartMergeService = new SmartMergeService();

export const syncEncuesta = async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
        const { id_encuesta, numero_documento, datos_recolectados } = req.body;
        const version_anterior_id = req.body.version_anterior_id || null;
        const fecha_encuesta = req.body.fecha_encuesta || null;

        // La app manda la identidad del encuestado; las versiones antiguas no lo
        // hacían, así que puede llegar vacía y en ese caso no se pisa lo que haya.
        const nombres = typeof req.body.nombres === 'string' ? req.body.nombres.trim() : '';
        const apellidos = typeof req.body.apellidos === 'string' ? req.body.apellidos.trim() : '';
        const tieneIdentidad = nombres.length > 0 || apellidos.length > 0;
        // El JWT nos dejó el id del usuario que originó el request
        const id_usuario = (req as any).user.id_usuario;

        // Validar fecha enviada por el cliente, fallback a CURRENT_TIMESTAMP
        const fechaApp = fecha_encuesta ? new Date(fecha_encuesta) : new Date();

        await client.query('BEGIN');

        // 1. Verificamos si la persona existe.
        const checkPersona = await client.query(
            'SELECT * FROM personas WHERE numero_documento = $1',
            [numero_documento]
        );

        if (checkPersona.rows.length === 0) {
            await client.query(
                'INSERT INTO personas (numero_documento, tipo_documento, nombres, apellidos) VALUES ($1, $2, $3, $4)',
                [
                    numero_documento,
                    'CC',
                    nombres || 'Desconocido',
                    apellidos || '(Sincronizado)'
                ]
            );
        } else if (tieneIdentidad) {
            // Se refresca la identidad con la última captura de campo y se marca
            // updated_at, que es la columna que el panel muestra como
            // "Última sincronización".
            await client.query(
                `UPDATE personas
                 SET nombres = COALESCE(NULLIF($2, ''), nombres),
                     apellidos = COALESCE(NULLIF($3, ''), apellidos),
                     updated_at = NOW()
                 WHERE numero_documento = $1`,
                [numero_documento, nombres, apellidos]
            );
        } else {
            await client.query(
                'UPDATE personas SET updated_at = NOW() WHERE numero_documento = $1',
                [numero_documento]
            );
        }

        // 2. Buscamos la versión más reciente (última sincronizada) de esta persona
        const checkLatest = await client.query(
            'SELECT * FROM historial_encuestas WHERE numero_documento = $1 ORDER BY fecha_sincronizacion DESC NULLS LAST, fecha_encuesta DESC LIMIT 1',
            [numero_documento]
        );

        const latestRecord = checkLatest.rows[0];

        // 3. Evaluar conflictos (Smart Merge)
        let datosFinales = datos_recolectados;
        let esActualizacion = false;
        let huboConflicto = false;
        let mergeResult: any = null;

        if (latestRecord) {
            esActualizacion = true;
            // Si el cliente envía una versión anterior y NO coincide con la última de la base de datos... CONFLICTO!
            if (version_anterior_id && version_anterior_id !== latestRecord.id_encuesta) {
                huboConflicto = true;
                
                const fechaDB = new Date(latestRecord.fecha_encuesta);
                
                // Aplicamos las 3 Reglas del Smart Merge
                mergeResult = smartMergeService.merge(
                    latestRecord.datos_recolectados, // datosA (BD)
                    datos_recolectados,              // datosB (Entrantes)
                    fechaDB,                         // fechaA (BD)
                    fechaApp                         // fechaB (Entrantes)
                );

                datosFinales = mergeResult.datosFusionados;
            }
        }

        // 4. Insertar la nueva versión en historial_encuestas (Append-Only)
        try {
            await client.query(
                `INSERT INTO historial_encuestas 
                 (id_encuesta, numero_documento, datos_recolectados, id_encuestador, fecha_encuesta, fecha_sincronizacion, es_actualizacion, version_anterior_id) 
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)`,
                [
                    id_encuesta, 
                    numero_documento, 
                    datosFinales, 
                    id_usuario, 
                    fechaApp,
                    esActualizacion,
                    huboConflicto ? latestRecord.id_encuesta : version_anterior_id
                ]
            );

            if (huboConflicto) {
                // Registrar en log_conflictos (después de insertar en historial_encuestas para respetar Foreign Key)
                await client.query(
                    `INSERT INTO log_conflictos 
                    (id_encuesta_nueva, id_encuesta_previa, datos_anteriores, datos_entrantes, datos_resultado, campos_en_conflicto, estrategia, resuelto_por, creado_en)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
                    [
                        id_encuesta, 
                        latestRecord.id_encuesta, 
                        latestRecord.datos_recolectados, 
                        datos_recolectados, 
                        datosFinales, 
                        mergeResult.camposEnConflicto, 
                        'SmartMerge_Strategy', 
                        id_usuario
                    ]
                );
            }

            await client.query('COMMIT');

            if (huboConflicto) {
                res.status(409).json({ 
                    message: 'Conflicto resuelto (Smart Merge aplicado)', 
                    id_encuesta,
                    datos_resultado: datosFinales
                });
            } else {
                res.status(200).json({ message: 'Sincronización exitosa', id_encuesta });
            }
        } catch (e: any) {
            await client.query('ROLLBACK');
            if (e.code === '23505') {
                // Si el ID de encuesta ya existe de forma exacta (reintento duplicado)
                res.status(409).json({ error: 'La encuesta ya fue sincronizada previamente' });
            } else {
                throw e;
            }
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sincronizando encuesta:', error);
        res.status(500).json({ error: 'Error interno del servidor al sincronizar' });
    } finally {
        client.release();
    }
};

/**
 * Consulta puntual de una persona por documento, para la app de campo.
 *
 * Sin esto, el Smart Merge no se disparaba nunca entre celulares distintos. El
 * formulario resolvia la version anterior contra la base Room del propio
 * telefono (FormScreen: repo.getLatestHistorial), asi que si Jorge encuestaba a
 * alguien y despues le tocaba a Maria desde otro celular, el suyo no conocia
 * esa captura y enviaba version_anterior_id = null. La condicion de conflicto
 * de syncEncuesta empieza por ese campo, de modo que con null no entraba: la
 * captura de Maria se guardaba como version nueva sin fusionar, y los campos
 * que ella dejara vacios quedaban vacios aunque Jorge los tuviera llenos.
 *
 * Devolviendo el id_encuesta vigente en el servidor se consigue ademas control
 * de concurrencia optimista: la app lo reenvia al sincronizar y, si mientras
 * tanto alguien mas sincronizo esa persona, deja de coincidir con la ultima y
 * el Smart Merge entra, que es justo para lo que se escribio.
 *
 * Devuelve una sola persona, nunca un listado: un celular de campo no tiene por
 * que llevar encima el censo entero.
 */
export const buscarPersona = async (req: Request, res: Response): Promise<void> => {
    // req.params llega tipado como string | string[]; el parametro de ruta es
    // uno solo, pero conviene normalizarlo antes de usarlo.
    const documento = String(req.params.documento ?? '').trim();

    if (documento.length === 0) {
        res.status(400).json({ error: 'Falta el numero de documento' });
        return;
    }

    const client = await pool.connect();
    try {
        const persona = await client.query(
            `SELECT p.numero_documento, p.tipo_documento, p.nombres, p.apellidos,
                    p.telefono, p.email, p.direccion, p.eps, p.ocupacion, p.estrato,
                    p.municipio_codigo, m.nombre AS municipio
             FROM personas p
             LEFT JOIN municipios m ON m.codigo = p.municipio_codigo
             WHERE p.numero_documento = $1`,
            [documento]
        );

        // Que no exista es una respuesta normal a "esta ya registrada?", no un
        // error: con 404 la app tendria que distinguir un fallo de red de un
        // documento nuevo, que es el caso mas comun en campo.
        if (persona.rowCount === 0) {
            res.status(200).json({ encontrada: false });
            return;
        }

        const ultima = await client.query(
            `SELECT he.id_encuesta, he.datos_recolectados, he.fecha_encuesta,
                    he.fecha_sincronizacion, u.nombre_completo AS encuestador
             FROM historial_encuestas he
             LEFT JOIN usuarios u ON u.id_usuario = he.id_encuestador
             WHERE he.numero_documento = $1
             ORDER BY he.fecha_sincronizacion DESC NULLS LAST, he.fecha_encuesta DESC
             LIMIT 1`,
            [documento]
        );

        res.status(200).json({
            encontrada: true,
            persona: persona.rows[0],
            ultimaVersion: ultima.rows[0] ?? null,
        });
    } catch (error) {
        console.error('Error buscando persona:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};
