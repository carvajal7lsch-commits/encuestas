package com.minsalud.encuestas.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "personas")
data class PersonaEntity(
    @PrimaryKey
    val numeroDocumento: String,
    val primerNombre: String,
    val primerApellido: String,
    val syncVersion: Long,
    val syncStatus: String, // pending, synced, conflict
    val updatedAt: Long
)
