package com.minsalud.encuestas.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.minsalud.encuestas.data.local.entity.ColaSyncEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ColaSyncDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSyncTask(task: ColaSyncEntity): Long

    @Query("SELECT * FROM cola_sincronizacion WHERE estado = 'pending' ORDER BY id ASC")
    suspend fun getPendingTasks(): List<ColaSyncEntity>

    @Query("SELECT COUNT(*) FROM cola_sincronizacion WHERE estado = 'pending'")
    fun getPendingCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cola_sincronizacion WHERE estado = 'pending'")
    suspend fun getPendingCount(): Int

    @Update
    suspend fun updateSyncTask(task: ColaSyncEntity): Int
}
