package com.minsalud.encuestas.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "historial_encuestas")
data class HistorialEntity(
    @PrimaryKey
    val idHistorial: String, // UUID
    val numeroDocumentoPersona: String,
    val datosRecolectados: String, // JSON
    val fechaEncuesta: Long,
    val fechaSincronizacion: Long?,
    val versionAnteriorId: String? // UUID nullable
)
