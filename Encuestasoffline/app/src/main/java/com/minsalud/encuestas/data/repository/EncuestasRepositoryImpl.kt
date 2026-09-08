package com.minsalud.encuestas.data.repository

import androidx.room.withTransaction
import com.minsalud.encuestas.MinsaludApplication
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.local.entity.ColaSyncEntity
import com.minsalud.encuestas.data.local.entity.HistorialEntity
import com.minsalud.encuestas.data.local.entity.PersonaEntity
import com.minsalud.encuestas.worker.SyncScheduler
import kotlinx.coroutines.flow.Flow

class EncuestasRepositoryImpl(
    private val database: AppDatabase
) {
    private val personaDao = database.personaDao()
    private val historialDao = database.historialDao()
    private val colaSyncDao = database.colaSyncDao()

    /**
     * Esta función es el corazón del guardado offline.
     * Utiliza @Transaction (via withTransaction) para garantizar que,
     * si el celular se apaga a la mitad, no queden datos corruptos.
     */
    suspend fun guardarEncuestaOfflineAtomo(
        persona: PersonaEntity,
        historial: HistorialEntity,
        payloadSync: String
    ) {
        database.withTransaction {
            // 1. Guardar la versión local de la persona
            personaDao.insertPersona(persona)

            // 2. Guardar el log inmutable
            historialDao.insertHistorial(historial)

            // 3. Poner en la bandeja de salida para que WorkManager lo suba
            val tareaSincronizacion = ColaSyncEntity(
                accion = "UPSERT",
                payload = payloadSync,
                estado = "pending"
            )
            colaSyncDao.insertSyncTask(tareaSincronizacion)
        }

        // El encolado va FUERA de la transacción a propósito: si WorkManager
        // fallara al encolar dentro de ella, se revertiría la encuesta ya guardada.
        // Con la transacción cerrada, el dato queda a salvo pase lo que pase aquí.
        MinsaludApplication.appContext?.let { SyncScheduler.sincronizarAhora(it) }
    }

    fun obtenerTodasLasPersonas(): Flow<List<PersonaEntity>> {
        return personaDao.getAllPersonas()
    }

    suspend fun getPersona(documento: String): PersonaEntity? {
        return personaDao.getPersona(documento)
    }

    suspend fun getLatestHistorial(documento: String): HistorialEntity? {
        val historiales = historialDao.getHistorialByPersona(documento)
        return historiales.firstOrNull()
    }

    fun getPendingSyncCountFlow(): Flow<Int> {
        return colaSyncDao.getPendingCountFlow()
    }
}
