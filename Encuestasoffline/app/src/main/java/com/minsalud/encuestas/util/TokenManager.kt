package com.minsalud.encuestas.util

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import java.security.KeyStore

class TokenManager(context: Context) : SessionStore {
    private val prefs: SharedPreferences = context.getSharedPreferences("minsalud_prefs", Context.MODE_PRIVATE)

    fun saveToken(token: String) {
        prefs.edit().putString("jwt_token", token).putBoolean("login_required", false).apply()
    }

    override fun saveRenewedToken(expected: String?, token: String): String? = synchronized(sessionLock) {
        if (getToken() != expected) getToken()
        else { saveToken(token); token }
    }

    fun saveSession(token: String, refreshToken: String?) = synchronized(sessionLock) {
        val editor = prefs.edit().putString("jwt_token", token).putBoolean("login_required", false)
        if (refreshToken == null) editor.remove("refresh_encrypted")
        else {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key())
            val encrypted = cipher.doFinal(refreshToken.toByteArray(Charsets.UTF_8))
            editor.putString("refresh_encrypted", Base64.encodeToString(cipher.iv + encrypted, Base64.NO_WRAP))
        }
        editor.apply()
    }

    override fun getRefreshToken(): String? = runCatching {
        val stored = prefs.getString("refresh_encrypted", null) ?: return@runCatching null
        val bytes = Base64.decode(stored, Base64.NO_WRAP)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
        String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8)
    }.getOrNull()

    override fun requiresLogin() = prefs.getBoolean("login_required", false)
    override fun requireLogin() { prefs.edit().putBoolean("login_required", true).apply() }
    fun observe(listener: SharedPreferences.OnSharedPreferenceChangeListener) = prefs.registerOnSharedPreferenceChangeListener(listener)
    fun stopObserving(listener: SharedPreferences.OnSharedPreferenceChangeListener) = prefs.unregisterOnSharedPreferenceChangeListener(listener)

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey("encuestas_refresh", null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder("encuestas_refresh", KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }

    override fun getToken(): String? {
        return prefs.getString("jwt_token", null)
    }

    fun clearToken() = synchronized(sessionLock) {
        prefs.edit().remove("jwt_token").remove("refresh_encrypted").putBoolean("login_required", false).apply()
    }

    companion object { private val sessionLock = Any() }
}
