package com.minsalud.encuestas

import com.minsalud.encuestas.data.network.AuthInterceptor
import com.minsalud.encuestas.util.SessionStore
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import java.io.IOException

class AuthInterceptorTest {
    private lateinit var server: MockWebServer
    private val session = FakeSession()
    private lateinit var client: OkHttpClient

    @Before fun setup() {
        server = MockWebServer().apply { start() }
        client = OkHttpClient.Builder().retryOnConnectionFailure(false)
            .addInterceptor(AuthInterceptor(session, OkHttpClient())).build()
    }
    @After fun close() { server.shutdown() }

    private fun send() = client.newCall(Request.Builder().url(server.url("/api/sync/encuestas")).build()).execute()

    @Test fun expiredAccessRenewsAndResendsWithTheNewToken() {
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setBody("{\"token\":\"nuevo\"}"))
        server.enqueue(MockResponse().setBody("recibida"))
        send().use { assertEquals(200, it.code) }
        assertEquals("Bearer anterior", server.takeRequest().getHeader("Authorization"))
        val renewal = server.takeRequest()
        assertEquals("/api/auth/refresh", renewal.path)
        assertNull(renewal.getHeader("Authorization"))
        assertEquals("Bearer nuevo", server.takeRequest().getHeader("Authorization"))
        assertFalse(session.required)
    }

    @Test fun rejectedRenewalRequestsLoginWithoutDiscardingAccessOrSurveys() {
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(401))
        send().use { assertEquals(401, it.code) }
        assertTrue(session.required)
        assertEquals("anterior", session.access)
    }

    @Test fun temporaryServerFailurePreservesSessionAndAllowsRetry() {
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(503))
        try { send().close(); fail("Debió indicar un fallo transitorio") } catch (_: IOException) { }
        assertFalse(session.required)
        assertEquals("anterior", session.access)
        assertEquals("renovacion", session.refresh)
    }

    @Test fun oldApkSessionWithoutRefreshExplainsThatItNeedsOneLogin() {
        session.refresh = null
        server.enqueue(MockResponse().setResponseCode(401))
        send().use { assertEquals(401, it.code) }
        assertTrue(session.required)
        assertEquals(1, server.requestCount)
    }

    @Test fun logoutDuringRenewalNeverRestoresTheSession() {
        session.logoutBeforeSave = true
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setBody("{\"token\":\"nuevo\"}"))
        send().use { assertEquals(401, it.code) }
        assertNull(session.access)
        assertEquals(2, server.requestCount)
    }

    private class FakeSession : SessionStore {
        var access: String? = "anterior"
        var refresh: String? = "renovacion"
        var required = false
        var logoutBeforeSave = false
        override fun getToken() = access
        override fun getRefreshToken() = refresh
        override fun requiresLogin() = required
        override fun requireLogin() { required = true }
        override fun saveRenewedToken(expected: String?, token: String): String? {
            if (logoutBeforeSave) { access = null; refresh = null }
            if (access == expected) access = token
            return access
        }
    }
}
