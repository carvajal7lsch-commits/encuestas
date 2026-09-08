package com.minsalud.encuestas.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.local.dao.ColaSyncDao
import com.minsalud.encuestas.data.local.dao.PersonaDao
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
        val personaDao = database.personaDao()
        val gson = Gson()

        val tokenManager = TokenManager(applicationContext)
        val token = tokenManager.getToken()

        if (token.isNullOrEmpty()) {
            Log.e(TAG, "No hay token de sesión. Cancelando sincronización.")
            return@withContext Result.failure()
        }

        val pendingTasks = colaDao.getPendingTasks()
        if (pendingTasks.isEmpty()) {
            // Aunque no haya nada que subir, repasamos los estados: así se reparan
            // las fichas de versiones anteriores que quedaron marcadas como "Local"
            // pese a estar ya en el servidor.
            reconciliarPersonas(colaDao, personaDao, gson)
            return@withContext Result.success()
        }

        val apiService = RetrofitClient.getApiService(tokenManager)
        var allSuccessful = true

        for (task in pendingTasks) {
            val payloadMap = runCatching {
                gson.fromJson(task.payload, Map::class.java)
            }.getOrNull()

            if (payloadMap == null) {
                // Un payload ilegible no se arregla reintentando: lo sacamos de la cola
                // como error para que el contador de pendientes no se quede clavado.
                Log.e(TAG, "Payload local ilegible en la tarea ${task.id}. Se descarta.")
                colaDao.updateSyncTask(
                    task.copy(estado = "error", ultimoError = "Payload local ilegible")
                )
                continue
            }

            val idEncuesta = payloadMap["idEncuesta"] as? String ?: ""
            val documento = payloadMap["numeroDocumento"] as? String ?: ""
            val datosRecolectados = payloadMap["datosRecolectados"] as? String ?: "{}"
            val versionAnteriorId = payloadMap["versionAnteriorId"] as? String
            val fechaEncuesta = payloadMap["fechaEncuesta"] as? String
            // Pueden venir vacíos en tareas encoladas por versiones anteriores
            // de la app, que aún no incluían la identidad en el payload.
            val nombres = payloadMap["nombres"] as? String
            val apellidos = payloadMap["apellidos"] as? String

            val syncPayload = SyncPayload(
                id_encuesta = idEncuesta,
                numero_documento = documento,
                datos_recolectados = datosRecolectados,
                version_anterior_id = versionAnteriorId,
                fecha_encuesta = fechaEncuesta,
                nombres = nombres,
                apellidos = apellidos
            )

            try {
                val response = apiService.syncEncuesta(syncPayload)
                val codigo = response.code()

                when {
                    // 200 = subida limpia. 409 = el backend ya la tiene (Smart Merge
                    // aplicado o reintento duplicado). En ambos casos el dato YA está
                    // en el servidor, así que la tarea sale de la cola.
                    response.isSuccessful || codigo == 409 -> {
                        val estado = if (codigo == 409) "conflict_resolved" else "sent"
                        val error = if (codigo == 409) "409 Conflict - Smart Merge aplicado" else null

                        colaDao.updateSyncTask(task.copy(estado = estado, ultimoError = error))
                        if (idEncuesta.isNotEmpty()) {
                            historialDao.marcarSincronizado(idEncuesta, System.currentTimeMillis())
                        }
                    }

                    // Token vencido: la tarea se queda pendiente para que suba sola
                    // en cuanto el encuestador vuelva a iniciar sesión.
                    codigo == 401 -> {
                        allSuccessful = false
                        Log.w(TAG, "Sesión expirada al sincronizar la encuesta $idEncuesta.")
                        colaDao.updateSyncTask(
                            task.copy(
                                intentos = task.intentos + 1,
                                ultimoError = "401: sesión expirada, vuelva a iniciar sesión"
                            )
                        )
                    }

                    else -> {
                        allSuccessful = false
                        colaDao.updateSyncTask(
                            task.copy(
                                intentos = task.intentos + 1,
                                ultimoError = "HTTP $codigo: ${response.errorBody()?.string()}"
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                allSuccessful = false
                Log.e(TAG, "Error de red: ${e.message}")
                colaDao.updateSyncTask(
                    task.copy(
                        intentos = task.intentos + 1,
                        ultimoError = e.message
                    )
                )
            }
        }

        reconciliarPersonas(colaDao, personaDao, gson)

        if (allSuccessful) Result.success() else Result.retry()
    }

    /**
     * Pone en "synced" a toda persona cuyas encuestas ya viajaron completas.
     *
     * Este paso faltaba: el worker marcaba la cola como enviada pero nunca tocaba
     * la tabla `personas`, así que el chip de la ficha se quedaba en "Local" para
     * siempre aunque el registro estuviera arriba hace rato.
     *
     * Una persona solo se considera sincronizada si tiene al menos una tarea
     * confirmada y ninguna todavía en vuelo (pendiente o en error).
     */
    private suspend fun reconciliarPersonas(
        colaDao: ColaSyncDao,
        personaDao: PersonaDao,
        gson: Gson
    ) {
        val confirmados = mutableSetOf<String>()
        val enVuelo = mutableSetOf<String>()

        for (task in colaDao.getAllTasks()) {
            val documento = runCatching {
                gson.fromJson(task.payload, Map::class.java)
            }.getOrNull()?.get("numeroDocumento") as? String ?: continue

            when (task.estado) {
                "sent", "conflict_resolved" -> confirmados.add(documento)
                else -> enVuelo.add(documento)
            }
        }

        for (documento in confirmados - enVuelo) {
            personaDao.actualizarSyncStatus(documento, "synced")
        }
    }

    companion object {
        private const val TAG = "SyncWorker"
    }
}
