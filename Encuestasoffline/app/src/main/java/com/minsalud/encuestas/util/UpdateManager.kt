package com.minsalud.encuestas.util

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.util.Log
import androidx.core.content.FileProvider
import com.minsalud.encuestas.data.network.AppVersionInfo
import com.minsalud.encuestas.data.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Actualización de la app sin tienda: la APK se distribuye por fuera de Google
 * Play, así que el propio equipo consulta un manifiesto publicado junto al APK,
 * avisa si hay versión nueva, la descarga y abre el instalador de Android.
 */
object UpdateManager {

    /** Manifiesto publicado por el sitio, al lado del .apk. */
    const val VERSION_URL = "https://encuestas.secarvajal.com/app-version.json"

    private const val TAG = "UpdateManager"
    private const val ARCHIVO_DESCARGA = "EncuestasOffline-update.apk"
    private const val PREFS = "minsalud_prefs"
    private const val KEY_VERSION_POSPUESTA = "update_version_pospuesta"

    /** Resultado de consultar el manifiesto remoto. */
    sealed interface Resultado {
        data class Disponible(val info: AppVersionInfo) : Resultado
        data object AlDia : Resultado
        data object NoDisponible : Resultado
    }

    fun versionInstalada(context: Context): Int = runCatching {
        val info = context.packageManager.getPackageInfo(context.packageName, 0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            info.longVersionCode.toInt()
        } else {
            @Suppress("DEPRECATION")
            info.versionCode
        }
    }.getOrDefault(0)

    fun nombreVersionInstalada(context: Context): String = runCatching {
        context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "—"
    }.getOrDefault("—")

    /**
     * Consulta el manifiesto. Nunca lanza: sin red simplemente devuelve
     * [Resultado.NoDisponible] y la app sigue funcionando offline con normalidad.
     */
    suspend fun buscarActualizacion(context: Context): Resultado = withContext(Dispatchers.IO) {
        try {
            val api = RetrofitClient.getApiService(TokenManager(context))
            val respuesta = api.getAppVersion(VERSION_URL)
            val info = respuesta.body()

            if (!respuesta.isSuccessful || info == null) {
                Log.w(TAG, "Manifiesto no disponible (HTTP ${respuesta.code()})")
                return@withContext Resultado.NoDisponible
            }

            if (info.versionCode > versionInstalada(context)) {
                Resultado.Disponible(info)
            } else {
                Resultado.AlDia
            }
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo consultar la versión: ${e.message}")
            Resultado.NoDisponible
        }
    }

    /** "Ahora no": se calla hasta que se publique una versión más nueva. */
    fun posponer(context: Context, versionCode: Int) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putInt(KEY_VERSION_POSPUESTA, versionCode)
            .apply()
    }

    fun fuePospuesta(context: Context, versionCode: Int): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getInt(KEY_VERSION_POSPUESTA, -1) == versionCode

    /**
     * Android exige permiso explícito para instalar APKs desde una app que no es
     * una tienda. Si falta, hay que mandar al usuario a la pantalla del sistema.
     */
    fun puedeInstalar(context: Context): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }

    fun abrirAjustesDeInstalacion(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val intent = Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:${context.packageName}")
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        runCatching { context.startActivity(intent) }
    }

    /**
     * Descarga el APK reportando avance de 0 a 100. Devuelve el archivo listo para
     * instalar, o null si la descarga falló.
     */
    suspend fun descargarApk(
        context: Context,
        apkUrl: String,
        onProgreso: (Int) -> Unit
    ): File? = withContext(Dispatchers.IO) {
        try {
            val destino = File(
                context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                ARCHIVO_DESCARGA
            )
            if (destino.exists()) destino.delete()

            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val peticion = DownloadManager.Request(Uri.parse(apkUrl))
                .setTitle("EncuestasOffline")
                .setDescription("Descargando la nueva versión…")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(
                    context,
                    Environment.DIRECTORY_DOWNLOADS,
                    ARCHIVO_DESCARGA
                )

            val idDescarga = manager.enqueue(peticion)

            // Se consulta el avance en lugar de registrar un BroadcastReceiver:
            // evita las restricciones de receivers en Android 14+ y permite pintar
            // una barra de progreso real dentro del diálogo.
            while (true) {
                val consulta = DownloadManager.Query().setFilterById(idDescarga)
                val cursor = manager.query(consulta) ?: return@withContext null

                cursor.use {
                    if (!it.moveToFirst()) return@withContext null

                    val estado = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    val bajados = it.getLong(
                        it.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                    )
                    val total = it.getLong(
                        it.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                    )

                    if (total > 0) {
                        onProgreso(((bajados * 100) / total).toInt().coerceIn(0, 100))
                    }

                    when (estado) {
                        DownloadManager.STATUS_SUCCESSFUL -> {
                            onProgreso(100)
                            return@withContext destino
                        }
                        DownloadManager.STATUS_FAILED -> {
                            Log.e(TAG, "La descarga del APK falló.")
                            return@withContext null
                        }
                    }
                }

                delay(400)
            }
            @Suppress("UNREACHABLE_CODE")
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error descargando el APK: ${e.message}")
            null
        }
    }

    /** Abre el instalador del sistema con el APK ya descargado. */
    fun instalar(context: Context, apk: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apk
        )

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        runCatching { context.startActivity(intent) }
            .onFailure { Log.e(TAG, "No se pudo abrir el instalador: ${it.message}") }
    }
}
