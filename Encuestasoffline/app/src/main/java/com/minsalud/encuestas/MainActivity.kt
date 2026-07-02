package com.minsalud.encuestas

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.minsalud.encuestas.ui.navigation.AppNavigation
import com.minsalud.encuestas.ui.theme.AppTheme
import com.minsalud.encuestas.worker.SyncWorker
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Constraints
import androidx.work.NetworkType
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Encolar trabajador de sincronización (cada 15 min aprox cuando hay red)
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val syncWorkRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()
            
        WorkManager.getInstance(this).enqueue(syncWorkRequest)

        setContent {
            AppTheme {
                AppNavigation()
            }
        }
    }
}