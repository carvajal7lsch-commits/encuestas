package com.minsalud.encuestas

import android.app.Application
import android.content.Context

class MinsaludApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        appContext = applicationContext
    }

    companion object {
        var appContext: Context? = null
            private set
    }
}
