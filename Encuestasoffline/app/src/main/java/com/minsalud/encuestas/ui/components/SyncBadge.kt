package com.minsalud.encuestas.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.minsalud.encuestas.data.repository.SyncStatus
import com.minsalud.encuestas.data.repository.SyncStatusRepository
import com.minsalud.encuestas.worker.SyncScheduler

@Composable
fun SyncStatusBadge(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val repo = remember(context) { SyncStatusRepository(context) }
    val status by repo.status.collectAsState(initial = SyncStatus())
    AssistChip(
        modifier = modifier,
        onClick = { if (!status.loginRequired) SyncScheduler.sincronizarAhora(context) },
        label = { Text(status.label, style = MaterialTheme.typography.labelSmall) },
        leadingIcon = {
            if (status.sending && status.pending > 0 && !status.loginRequired) {
                CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
            } else Icon(
                if (status.loginRequired || status.errors > 0) Icons.Default.Warning
                else if (status.pending > 0) Icons.Default.CloudOff else Icons.Default.CloudDone,
                contentDescription = null, modifier = Modifier.size(16.dp)
            )
        },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = MaterialTheme.colorScheme.surface,
            labelColor = if (status.errors > 0 || status.loginRequired) MaterialTheme.colorScheme.error
                else MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
fun SyncStatusNotice(onLogin: () -> Unit, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val repo = remember(context) { SyncStatusRepository(context) }
    val status by repo.status.collectAsState(initial = SyncStatus())
    if (status.loginRequired || status.pending + status.errors > 0) {
        Surface(modifier = modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.secondaryContainer) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(if (status.loginRequired) "Necesitas iniciar sesión para enviar" else status.label,
                    style = MaterialTheme.typography.titleSmall)
                Text(when {
                    status.loginRequired -> "Tus encuestas siguen guardadas en este teléfono. Puedes continuar capturando y enviarlas al volver a iniciar sesión."
                    status.errors > 0 -> "Algunas encuestas no fueron aceptadas. Se conservan en el teléfono y necesitan revisión."
                    !status.online -> "Tus encuestas están guardadas. Intentaremos enviarlas cuando vuelva internet."
                    status.sending -> "Espera la confirmación del servidor. Puedes seguir usando la app."
                    else -> "Tus encuestas están guardadas; reintentaremos el envío automáticamente."
                }, style = MaterialTheme.typography.bodySmall)
                if (status.loginRequired) {
                    TextButton(onClick = onLogin) { Text("Iniciar sesión") }
                } else if (status.pending > 0 && status.online && !status.sending) {
                    TextButton(onClick = { SyncScheduler.sincronizarAhora(context) }) { Text("Reintentar envío") }
                }
            }
        }
    }
}
