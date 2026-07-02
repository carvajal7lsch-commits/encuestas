package com.minsalud.encuestas.data.network

import android.os.Build
import com.minsalud.encuestas.util.TokenManager
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    /**
     * Detección dinámica de URL del backend:
     * - En Emulador Android: usa http://10.0.2.2:3000/api/
     * - En Celular Físico por Cable USB: usa http://127.0.0.1:3000/api/ mediante 'adb reverse tcp:3000 tcp:3000'
     */
    private val isEmulator: Boolean
        get() = (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)

    private val BASE_URL: String
        get() = if (isEmulator) {
            "http://10.0.2.2:3000/api/"
        } else {
            "http://127.0.0.1:3000/api/"
        }

    fun getApiService(tokenManager: TokenManager): ApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
