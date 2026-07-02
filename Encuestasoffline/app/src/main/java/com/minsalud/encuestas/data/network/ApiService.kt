package com.minsalud.encuestas.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {

    // (La implementaremos para que sea 100% funcional si la necesitas luego)
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // Endpoint de sincronización (Phase 4)
    @POST("sync/encuestas")
    suspend fun syncEncuesta(@Body payload: SyncPayload): Response<SyncResponse>
}

// DTOs
data class LoginRequest(val identificador: String, val password: String)
data class LoginResponse(val token: String)

data class SyncPayload(
    val id_encuesta: String, // UUID
    val numero_documento: String,
    val datos_recolectados: String, // JSON payload String
    val version_anterior_id: String?, // UUID opcional
    val fecha_encuesta: String? // Timestamp opcional
)

data class SyncResponse(
    val message: String, 
    val id_encuesta: String,
    val datos_resultado: Any? // Puede venir el JSON fusionado en caso de 409
)
