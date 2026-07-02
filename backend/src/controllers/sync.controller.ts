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
                [numero_documento, 'CC', 'Desconocido', '(Sincronizado)']
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
