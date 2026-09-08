package com.minsalud.encuestas.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.minsalud.encuestas.data.network.AppVersionInfo
import com.minsalud.encuestas.util.UpdateManager
import kotlinx.coroutines.launch
import java.io.File

/** Etapas del flujo de actualización dentro de la app. */
private sealed interface EstadoUpdate {
    data object Oculto : EstadoUpdate
    data class Disponible(val info: AppVersionInfo) : EstadoUpdate
    data class Descargando(val info: AppVersionInfo, val progreso: Int) : EstadoUpdate
    data class PermisoRequerido(val apk: File, val info: AppVersionInfo) : EstadoUpdate
    data class Fallo(val info: AppVersionInfo) : EstadoUpdate
}

/**
 * Envuelve la app y avisa cuando hay una versión nueva publicada.
 *
 * Evita tener que entrar a la página a bajar el APK a mano: consulta el
 * manifiesto al abrir, descarga en segundo plano y lanza el instalador.
 */
@Composable
fun AppUpdateGate(content: @Composable () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var estado by remember { mutableStateOf<EstadoUpdate>(EstadoUpdate.Oculto) }

    LaunchedEffect(Unit) {
        val resultado = UpdateManager.buscarActualizacion(context)
        if (resultado is UpdateManager.Resultado.Disponible) {
            val info = resultado.info
            // Si el usuario ya dijo "ahora no" para esta versión no se le insiste,
            // salvo que la actualización esté marcada como obligatoria.
            if (info.obligatoria || !UpdateManager.fuePospuesta(context, info.versionCode)) {
                estado = EstadoUpdate.Disponible(info)
            }
        }
    }

    fun descargar(info: AppVersionInfo) {
        estado = EstadoUpdate.Descargando(info, 0)
        scope.launch {
            val apk = UpdateManager.descargarApk(context, info.apkUrl) { progreso ->
                estado = EstadoUpdate.Descargando(info, progreso)
            }

            estado = when {
                apk == null -> EstadoUpdate.Fallo(info)
                !UpdateManager.puedeInstalar(context) -> EstadoUpdate.PermisoRequerido(apk, info)
                else -> {
                    UpdateManager.instalar(context, apk)
                    EstadoUpdate.Oculto
                }
            }
        }
    }

    content()

    when (val actual = estado) {
        is EstadoUpdate.Oculto -> Unit

        is EstadoUpdate.Disponible -> {
            val info = actual.info
            AlertDialog(
                onDismissRequest = {
                    if (!info.obligatoria) estado = EstadoUpdate.Oculto
                },
                icon = {
                    Icon(
                        Icons.Default.SystemUpdate,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                title = { Text("Nueva versión disponible") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Versión ${info.versionName} · tienes la " +
                                UpdateManager.nombreVersionInstalada(context),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )

                        if (info.notas.isNotEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                info.notas.forEach { nota ->
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(
                                            Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            modifier = Modifier
                                                .padding(top = 3.dp)
                                                .size(14.dp),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                        Text(nota, style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                        }

                        Text(
                            text = "Las encuestas guardadas en el dispositivo no se pierden al actualizar.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                confirmButton = {
                    Button(onClick = { descargar(info) }) {
                        Icon(
                            Icons.Default.CloudDownload,
                            contentDescription = null,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text("Actualizar ahora")
                    }
                },
                dismissButton = {
                    if (!info.obligatoria) {
                        TextButton(onClick = {
                            UpdateManager.posponer(context, info.versionCode)
                            estado = EstadoUpdate.Oculto
                        }) {
                            Text("Ahora no")
                        }
                    }
                }
            )
        }

        is EstadoUpdate.Descargando -> {
            AlertDialog(
                onDismissRequest = { },
                icon = {
                    Icon(
                        Icons.Default.CloudDownload,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                title = { Text("Descargando actualización") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        LinearProgressIndicator(
                            progress = { actual.progreso / 100f },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            text = "${actual.progreso}% · versión ${actual.info.versionName}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                confirmButton = { }
            )
        }

        is EstadoUpdate.PermisoRequerido -> {
            AlertDialog(
                onDismissRequest = { estado = EstadoUpdate.Oculto },
                icon = {
                    Icon(
                        Icons.Default.Security,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                title = { Text("Autoriza la instalación") },
                text = {
                    Text(
                        "Android necesita tu permiso para que EncuestasOffline instale " +
                            "actualizaciones. Activa la opción y vuelve para continuar."
                    )
                },
                confirmButton = {
                    Button(onClick = { UpdateManager.abrirAjustesDeInstalacion(context) }) {
                        Text("Abrir ajustes")
                    }
                },
                dismissButton = {
                    TextButton(onClick = {
                        if (UpdateManager.puedeInstalar(context)) {
                            UpdateManager.instalar(context, actual.apk)
                            estado = EstadoUpdate.Oculto
                        }
                    }) {
                        Text("Ya lo autoricé")
                    }
                }
            )
        }

        is EstadoUpdate.Fallo -> {
            AlertDialog(
                onDismissRequest = { estado = EstadoUpdate.Oculto },
                icon = {
                    Icon(
                        Icons.Default.ErrorOutline,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                },
                title = { Text("No se pudo descargar") },
                text = {
                    Text(
                        "Revisa la conexión e inténtalo de nuevo. Puedes seguir " +
                            "trabajando con normalidad: tus encuestas no se ven afectadas."
                    )
                },
                confirmButton = {
                    Button(onClick = { descargar(actual.info) }) { Text("Reintentar") }
                },
                dismissButton = {
                    TextButton(onClick = { estado = EstadoUpdate.Oculto }) { Text("Cerrar") }
                }
            )
        }
    }
}
