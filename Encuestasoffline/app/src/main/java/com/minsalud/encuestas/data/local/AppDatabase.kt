package com.minsalud.encuestas.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.minsalud.encuestas.data.local.dao.ColaSyncDao
import com.minsalud.encuestas.data.local.dao.HistorialDao
import com.minsalud.encuestas.data.local.dao.PersonaDao
import com.minsalud.encuestas.data.local.entity.ColaSyncEntity
import com.minsalud.encuestas.data.local.entity.HistorialEntity
import com.minsalud.encuestas.data.local.entity.PersonaEntity

@Database(
    entities = [
        PersonaEntity::class,
        HistorialEntity::class,
        ColaSyncEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun personaDao(): PersonaDao
    abstract fun historialDao(): HistorialDao
    abstract fun colaSyncDao(): ColaSyncDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "encuestas_offline_db"
                )
                .build()
                
                INSTANCE = instance
                instance
            }
        }
    }
}
