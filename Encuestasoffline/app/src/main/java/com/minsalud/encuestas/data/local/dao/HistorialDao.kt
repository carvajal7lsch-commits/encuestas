package com.minsalud.encuestas.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.minsalud.encuestas.data.local.entity.HistorialEntity

@Dao
interface HistorialDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistorial(historial: HistorialEntity): Long

    @Query("SELECT * FROM historial_encuestas WHERE numeroDocumentoPersona = :documento ORDER BY fechaEncuesta DESC")
    suspend fun getHistorialByPersona(documento: String): List<HistorialEntity>
}
