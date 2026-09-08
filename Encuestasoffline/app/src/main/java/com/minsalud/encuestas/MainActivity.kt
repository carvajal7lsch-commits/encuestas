package com.minsalud.encuestas

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.minsalud.encuestas.ui.components.AppUpdateGate
import com.minsalud.encuestas.ui.navigation.AppNavigation
import com.minsalud.encuestas.ui.theme.AppTheme
import com.minsalud.encuestas.worker.SyncScheduler

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Red de seguridad cada 15 min + un empujón al abrir la app, por si
        // quedaron encuestas en la cola de una jornada sin señal.
        SyncScheduler.programarPeriodico(this)
        SyncScheduler.sincronizarAhora(this)

        setContent {
            AppTheme {
                AppUpdateGate {
                    AppNavigation()
                }
            }
        }
    }
}