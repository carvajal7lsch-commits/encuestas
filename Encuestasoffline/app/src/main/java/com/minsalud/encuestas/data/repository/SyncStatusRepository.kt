package com.minsalud.encuestas.data.repository

import android.content.Context
import android.content.SharedPreferences
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.google.gson.Gson
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.util.TokenManager
import com.minsalud.encuestas.worker.SyncScheduler
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged

data class SyncStatus(
    val pending: Int = 0,
    val errors: Int = 0,
    val sending: Boolean = false,
    val online: Boolean = false,
    val loginRequired: Boolean = false,
    val retrying: Boolean = false,
    val documentsNeedingReview: Set<String> = emptySet()
) {
    val label: String get() = when {
        loginRequired && pending + errors > 0 -> "Inicia sesión para enviar"
        errors > 0 -> "$errors requieren revisión"
        pending > 0 && !online -> "$pending esperando internet"
        pending > 0 && sending -> "Enviando $pending encuesta(s)"
        pending > 0 && retrying -> "Envío pendiente · reintentaremos"
        pending > 0 -> "$pending listas para enviar"
        else -> "Sin envíos pendientes"
    }

    fun personLabel(document: String, confirmed: Boolean): String = when {
        confirmed -> "Recibida por el servidor"
        document in documentsNeedingReview -> "Guardada · revisar envío"
        loginRequired -> "Guardada · necesita iniciar sesión"
        !online -> "Guardada · esperando internet"
        else -> "Guardada · pendiente de envío"
    }
}

/** Única fuente del estado visible: red validada, sesión, cola y trabajo real. */
class SyncStatusRepository(context: Context) {
    private val app = context.applicationContext
    private val tokens = TokenManager(app)
    private val work = WorkManager.getInstance(app)
    private val tasks = AppDatabase.getDatabase(app).colaSyncDao().observeTasks()

    private val network = callbackFlow {
        val manager = app.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        fun publish() {
            val caps = manager.getNetworkCapabilities(manager.activeNetwork)
            trySend(caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true)
        }
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) = publish()
            override fun onLost(network: Network) = publish()
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) = publish()
        }
        manager.registerDefaultNetworkCallback(callback)
        publish()
        awaitClose { manager.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()

    private val session = callbackFlow {
        fun publish() { trySend(tokens.requiresLogin() || tokens.getToken().isNullOrBlank()) }
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> publish() }
        tokens.observe(listener)
        publish()
        awaitClose { tokens.stopObserving(listener) }
    }.distinctUntilChanged()

    private val workers = combine(
        work.getWorkInfosForUniqueWorkFlow(SyncScheduler.TRABAJO_INMEDIATO),
        work.getWorkInfosForUniqueWorkFlow(SyncScheduler.TRABAJO_PERIODICO)
    ) { immediate, periodic -> immediate + periodic }

    val status = combine(tasks, network, session, workers) { queue, online, login, workers ->
        SyncStatus(
            pending = queue.count { it.estado == "pending" },
            errors = queue.count { it.estado == "error" || it.estado == "conflict" },
            sending = workers.any { it.state == WorkInfo.State.RUNNING },
            online = online,
            loginRequired = login,
            retrying = queue.any { it.estado == "pending" && it.ultimoError != null },
            documentsNeedingReview = queue.filter { it.estado == "error" || it.estado == "conflict" }
                .mapNotNull { task -> runCatching {
                    Gson().fromJson(task.payload, Map::class.java)["numeroDocumento"] as? String
                }.getOrNull() }.toSet()
        )
    }.distinctUntilChanged()
}
