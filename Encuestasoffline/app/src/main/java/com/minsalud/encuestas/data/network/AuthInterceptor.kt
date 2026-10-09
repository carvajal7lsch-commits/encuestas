package com.minsalud.encuestas.data.network

import com.minsalud.encuestas.util.SessionStore
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import java.io.IOException

class AuthInterceptor(
    private val tokenManager: SessionStore,
    private val renewalClient: okhttp3.OkHttpClient = RetrofitClient.sessionClient
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        // Login/actualizaciones no deben intentar renovar una sesión anterior.
        if (chain.request().url.encodedPath.contains("/auth/") ||
            !chain.request().url.encodedPath.contains("/api/")) return chain.proceed(chain.request())
        val originalToken = tokenManager.getToken()
        val requestBuilder = chain.request().newBuilder()
        originalToken?.let { token ->
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        val response = chain.proceed(requestBuilder.build())
        if (response.code != 401) return response

        val renewed = synchronized(refreshLock) {
            // Otro request pudo renovar mientras este esperaba su respuesta.
            if (tokenManager.getToken() != originalToken) tokenManager.getToken()
            else if (tokenManager.requiresLogin()) null
            else {
                val refresh = tokenManager.getRefreshToken()
                if (refresh == null) { tokenManager.requireLogin(); null }
                else {
                    val url = chain.request().url.newBuilder().encodedPath("/api/auth/refresh").query(null).build()
                    val body = Gson().toJson(mapOf("refreshToken" to refresh)).toRequestBody("application/json".toMediaType())
                    val request = okhttp3.Request.Builder().url(url).post(body).build()
                    try {
                        renewalClient.newCall(request).execute().use { renewal ->
                            when {
                                renewal.isSuccessful -> {
                                    val token = Gson().fromJson(renewal.body?.string(), LoginResponse::class.java)?.token
                                    if (token.isNullOrBlank()) throw IOException("Respuesta de renovación incompleta")
                                    // Nunca restaurar una sesión que el usuario ya cerró.
                                    tokenManager.saveRenewedToken(originalToken, token)
                                }
                                renewal.code == 401 -> { tokenManager.requireLogin(); null }
                                else -> throw IOException("No se pudo renovar la sesión; se reintentará")
                            }
                        }
                    } catch (e: IOException) {
                        response.close()
                        throw e // Red/5xx conserva credenciales y dispara el backoff.
                    } catch (e: Exception) {
                        response.close()
                        throw IOException("No se pudo leer la renovación de sesión", e)
                    }
                }
            }
        }
        if (renewed == null) return response
        response.close()
        return chain.proceed(chain.request().newBuilder().header("Authorization", "Bearer $renewed").build())
    }

    companion object { private val refreshLock = Any() }
}
