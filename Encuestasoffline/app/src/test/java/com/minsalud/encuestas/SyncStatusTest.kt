package com.minsalud.encuestas

import com.minsalud.encuestas.data.repository.SyncStatus
import org.junit.Assert.*
import org.junit.Test

class SyncStatusTest {
    @Test fun recordsWithErrorsAreNotShownAsWaitingOnlyForInternet() {
        val status = SyncStatus(pending = 1, errors = 1, online = true, documentsNeedingReview = setOf("11111"))
        assertEquals("Guardada · revisar envío", status.personLabel("11111", false))
        assertEquals("Guardada · pendiente de envío", status.personLabel("22222", false))
        assertEquals("Recibida por el servidor", status.personLabel("33333", true))
    }
    @Test fun expiredSessionExplainsWhyPendingSurveysCannotUpload() {
        assertEquals("Inicia sesión para enviar", SyncStatus(pending = 2, online = true, loginRequired = true).label)
    }
    @Test fun beingOnlineDoesNotClaimAnUploadIsRunning() {
        assertEquals("2 listas para enviar", SyncStatus(pending = 2, online = true).label)
        assertEquals("Enviando 2 encuesta(s)", SyncStatus(pending = 2, online = true, sending = true).label)
    }
    @Test fun offlineErrorsAndRetriesAreDistinctFromConfirmation() {
        assertEquals("2 esperando internet", SyncStatus(pending = 2).label)
        assertEquals("1 requieren revisión", SyncStatus(errors = 1, online = true).label)
        assertEquals("Envío pendiente · reintentaremos", SyncStatus(pending = 1, online = true, retrying = true).label)
    }
}
