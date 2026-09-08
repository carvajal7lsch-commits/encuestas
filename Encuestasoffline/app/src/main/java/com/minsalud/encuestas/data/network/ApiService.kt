package com.minsalud.encuestas.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Url

interface ApiService {

    // (La implementaremos para que sea 100% funcional si la necesitas luego)
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // Endpoint de sincronización (Phase 4)
    @POST("sync/encuestas")
    suspend fun syncEncuesta(@Body payload: SyncPayload): Response<SyncResponse>

    /**
     * Manifiesto de la última versión publicada. Se pide con @Url absoluta porque
     * el archivo lo sirve el sitio web (junto al APK), no la API de /api/.
     */
    @GET
    suspend fun getAppVersion(@Url url: String): Response<AppVersionInfo>
}

// DTOs
data class LoginRequest(val identificador: String, val password: String)
data class LoginResponse(val token: String)

data class SyncPayload(
    val id_encuesta: String, // UUID
    val numero_documento: String,
    val datos_recolectados: String, // JSON payload String
    val version_anterior_id: String?, // UUID opcional
    val fecha_encuesta: String?, // Timestamp opcional
    // Identidad del encuestado. Van aparte de datos_recolectados porque el
    // servidor los guarda en columnas propias de la tabla personas.
    val nombres: String? = null,
    val apellidos: String? = null
)

data class SyncResponse(
    val message: String, 
    val id_encuesta: String,
    val datos_resultado: Any? // Puede venir el JSON fusionado en caso de 409
)

/** Contenido de app-version.json publicado junto al APK. */
data class AppVersionInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val obligatoria: Boolean = false,
    val notas: List<String> = emptyList()
)
