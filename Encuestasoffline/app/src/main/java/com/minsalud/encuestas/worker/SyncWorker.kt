package com.minsalud.encuestas.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.network.ApiService
import com.minsalud.encuestas.data.network.RetrofitClient
import com.minsalud.encuestas.data.network.SyncPayload
import com.minsalud.encuestas.util.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val database = AppDatabase.getDatabase(applicationContext)
        val colaDao = database.colaSyncDao()
        val historialDao = database.historialDao()
        
        val tokenManager = TokenManager(applicationContext)
        val token = tokenManager.getToken()
        
        if (token.isNullOrEmpty()) {
            Log.e("SyncWorker", "No hay token de sesión. Cancelando sincronización.")
            return@withContext Result.failure()
        }

        val apiService = RetrofitClient.getApiService(tokenManager)
        val gson = Gson()

        val pendingTasks = colaDao.getPendingTasks()
        if (pendingTasks.isEmpty()) {
            return@withContext Result.success()
        }

        var allSuccessful = true

        for (task in pendingTasks) {
            try {
                // Parseamos el payload que guardamos en la cola local
                val payloadMap = gson.fromJson(task.payload, Map::class.java)
                val idEncuesta = payloadMap["idEncuesta"] as? String ?: ""
                val documento = payloadMap["numeroDocumento"] as? String ?: ""
                val datosRecolectados = payloadMap["datosRecolectados"] as? String ?: "{}"
                val versionAnteriorId = payloadMap["versionAnteriorId"] as? String
                val fechaEncuesta = payloadMap["fechaEncuesta"] as? String

                val syncPayload = SyncPayload(
                    id_encuesta = idEncuesta,
                    numero_documento = documento,
                    datos_recolectados = datosRecolectados,
                    version_anterior_id = versionAnteriorId,
                    fecha_encuesta = fechaEncuesta
                )

                val response = apiService.syncEncuesta(syncPayload)
                
                if (response.isSuccessful) {
                    colaDao.updateSyncTask(task.copy(estado = "sent"))
                } else if (response.code() == 409) {
                    // Conflicto de versión (Smart Merge falló o ya existe). 
                    // El backend resolvió el conflicto y guardó el resultado.
                    // Para Android, marcamos la tarea como 'conflict_resolved'.
                    // (En la fase 6 real, aquí se actualizaría la base de datos local con el JSON fusionado).
                    colaDao.updateSyncTask(task.copy(estado = "conflict_resolved", ultimoError = "409 Conflict - Smart Merge Aplicado"))
                } else {
                    allSuccessful = false
                    colaDao.updateSyncTask(task.copy(
                        intentos = task.intentos + 1,
                        ultimoError = "HTTP ${response.code()}: ${response.errorBody()?.string()}"
                    ))
                }
            } catch (e: Exception) {
                allSuccessful = false
                Log.e("SyncWorker", "Error de red: ${e.message}")
                colaDao.updateSyncTask(task.copy(
                    intentos = task.intentos + 1,
                    ultimoError = e.message
                ))
            }
        }

        if (allSuccessful) Result.success() else Result.retry()
    }
}
