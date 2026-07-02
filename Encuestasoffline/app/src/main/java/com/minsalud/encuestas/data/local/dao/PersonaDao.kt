package com.minsalud.encuestas.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.minsalud.encuestas.data.local.entity.PersonaEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PersonaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPersona(persona: PersonaEntity): Long

    @Update
    suspend fun updatePersona(persona: PersonaEntity): Int

    @Query("SELECT * FROM personas WHERE numeroDocumento = :documento")
    suspend fun getPersona(documento: String): PersonaEntity?

    @Query("SELECT * FROM personas")
    fun getAllPersonas(): Flow<List<PersonaEntity>>
}
