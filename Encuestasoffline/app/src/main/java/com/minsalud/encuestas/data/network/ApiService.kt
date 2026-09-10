package com.minsalud.encuestas.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Url

interface ApiService {

    // (La implementaremos para que sea 100% funcional si la necesitas luego)
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // Endpoint de sincronización (Phase 4)
    @POST("sync/encuestas")
    suspend fun syncEncuesta(@Body payload: SyncPayload): Response<SyncResponse>

    /**
     * Consulta una persona ya registrada en el servidor, antes de capturarla.
     *
     * Sin esto el formulario solo miraba la base local del propio teléfono, así
     * que una persona encuestada por un compañero desde otro celular era
     * desconocida: se enviaba version_anterior_id nulo y el Smart Merge del
     * servidor no llegaba a ejecutarse nunca entre dispositivos distintos.
     */
    @GET("sync/personas/{documento}")
    suspend fun buscarPersona(@Path("documento") documento: String): Response<BusquedaPersona>

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

/** Respuesta de la consulta previa de una persona. */
data class BusquedaPersona(
    val encontrada: Boolean = false,
    val persona: PersonaRemota? = null,
    val ultimaVersion: VersionRemota? = null
)

data class PersonaRemota(
    val numero_documento: String,
    val nombres: String?,
    val apellidos: String?,
    val telefono: String?,
    val eps: String?,
    val municipio: String?
)

data class VersionRemota(
    /**
     * Id de la versión vigente en el servidor en el momento de consultar. Se
     * reenvía al sincronizar: si para entonces ya no es la última, el servidor
     * sabe que la captura se hizo sobre datos viejos y aplica el Smart Merge.
     */
    val id_encuesta: String,
    val datos_recolectados: Map<String, Any?>?,
    val fecha_encuesta: String?,
    val encuestador: String?
)

/** Contenido de app-version.json publicado junto al APK. */
data class AppVersionInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val obligatoria: Boolean = false,
    val notas: List<String> = emptyList()
)
