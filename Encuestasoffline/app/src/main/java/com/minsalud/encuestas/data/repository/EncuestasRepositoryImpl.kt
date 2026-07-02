package com.minsalud.encuestas.data.repository

import androidx.room.withTransaction
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.local.entity.ColaSyncEntity
import com.minsalud.encuestas.data.local.entity.HistorialEntity
import com.minsalud.encuestas.data.local.entity.PersonaEntity
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
            
            // Disparar sincronización inmediata
            val context = com.minsalud.encuestas.MinsaludApplication.appContext
            if (context != null) {
                val constraints = androidx.work.Constraints.Builder()
                    .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                    .build()
                val syncWork = androidx.work.OneTimeWorkRequestBuilder<com.minsalud.encuestas.worker.SyncWorker>()
                    .setConstraints(constraints)
                    .build()
                androidx.work.WorkManager.getInstance(context).enqueue(syncWork)
            }
        }
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
