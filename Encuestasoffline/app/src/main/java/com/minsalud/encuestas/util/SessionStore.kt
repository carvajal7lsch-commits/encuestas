package com.minsalud.encuestas.util

/** Contrato de credenciales, también permite probar renovación sin Android. */
interface SessionStore {
    fun getToken(): String?
    fun getRefreshToken(): String?
    fun requiresLogin(): Boolean
    fun requireLogin()
    fun saveRenewedToken(expected: String?, token: String): String?
}
