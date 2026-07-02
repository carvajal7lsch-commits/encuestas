package com.minsalud.encuestas.ui.components

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.repository.EncuestasRepositoryImpl
import com.minsalud.encuestas.worker.SyncWorker
import kotlinx.coroutines.flow.collectLatest

@Composable
fun SyncStatusBadge(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isOnline by remember { mutableStateOf(checkIsOnline(context)) }
    var pendingCount by remember { mutableIntStateOf(0) }

    // Registrar listener dinámico de red para cambiar en tiempo real entre En Línea y Offline
    DisposableEffect(context) {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                isOnline = true
            }
            override fun onLost(network: Network) {
                isOnline = false
            }
        }
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager?.registerNetworkCallback(request, networkCallback)

        onDispose {
            try {
                connectivityManager?.unregisterNetworkCallback(networkCallback)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    LaunchedEffect(Unit) {
        try {
            val db = AppDatabase.getDatabase(context)
            val repo = EncuestasRepositoryImpl(db)
            repo.getPendingSyncCountFlow().collectLatest { count ->
                pendingCount = count
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    val backgroundColor = when {
        pendingCount > 0 -> Color(0xFFFEF3C7) // Warning amber
        isOnline -> Color(0xFFDCFCE7) // Success green
        else -> Color(0xFFF3F4F6) // Neutral grey
    }

    val contentColor = when {
        pendingCount > 0 -> Color(0xFFB45309)
        isOnline -> Color(0xFF15803D)
        else -> Color(0xFF4B5563)
    }

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .clickable {
                try {
                    val constraints = Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                    val syncWork = OneTimeWorkRequestBuilder<SyncWorker>()
                        .setConstraints(constraints)
                        .build()
                    WorkManager.getInstance(context).enqueue(syncWork)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            },
        color = backgroundColor,
        shape = RoundedCornerShape(20.dp),
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Indicador LED de estado
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isOnline) Color(0xFF22C55E) else Color(0xFFEF4444))
            )

            Icon(
                imageVector = when {
                    pendingCount > 0 -> Icons.Default.Sync
                    isOnline -> Icons.Default.CloudDone
                    else -> Icons.Default.CloudOff
                },
                contentDescription = null,
                tint = contentColor,
                modifier = Modifier.size(16.dp)
            )

            Text(
                text = if (pendingCount > 0) "$pendingCount por subir" else if (isOnline) "En línea" else "Offline",
                color = contentColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

private fun checkIsOnline(context: Context): Boolean {
    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    val network = connectivityManager?.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}
