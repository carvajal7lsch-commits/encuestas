package com.minsalud.encuestas.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cola_sincronizacion")
data class ColaSyncEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val accion: String, // INSERT, UPDATE
    val payload: String, // JSON listo para enviar
    val estado: String, // pending, sent, conflict, error
    val intentos: Int = 0,
    val ultimoError: String? = null
)
