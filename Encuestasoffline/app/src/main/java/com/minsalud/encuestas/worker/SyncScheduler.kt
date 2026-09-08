package com.minsalud.encuestas.worker

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Punto único desde el que se encola la sincronización.
 *
 * Antes cada pantalla armaba su propio WorkRequest, y la periódica se volvía a
 * encolar en cada arranque de la app, acumulando trabajadores duplicados. Aquí
 * se usan nombres únicos para que siempre exista una sola cadena de trabajo.
 */
object SyncScheduler {

    private const val TRABAJO_PERIODICO = "sync_periodico_encuestas"
    private const val TRABAJO_INMEDIATO = "sync_inmediato_encuestas"

    private val soloConRed = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /** Red de seguridad: revisa la cola cada 15 min mientras haya conexión. */
    fun programarPeriodico(context: Context) {
        val request = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(soloConRed)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            TRABAJO_PERIODICO,
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    /**
     * Empuja la cola ahora mismo (al guardar una encuesta, al iniciar sesión o al
     * tocar el badge). Si no hay red, WorkManager lo deja esperando y lo dispara
     * solo en cuanto vuelva la señal.
     */
    fun sincronizarAhora(context: Context) {
        val request = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(soloConRed)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            TRABAJO_INMEDIATO,
            ExistingWorkPolicy.REPLACE,
            request
        )
    }
}
