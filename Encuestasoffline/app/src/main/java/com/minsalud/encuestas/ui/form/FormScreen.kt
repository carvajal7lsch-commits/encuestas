package com.minsalud.encuestas.ui.form

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Vaccines
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.gson.Gson
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.local.entity.HistorialEntity
import com.minsalud.encuestas.data.local.entity.PersonaEntity
import com.minsalud.encuestas.data.repository.EncuestasRepositoryImpl
import com.minsalud.encuestas.ui.components.SyncStatusBadge
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormScreen(
    documento: String,
    onFormSaved: () -> Unit,
    onBack: () -> Unit
) {
    var nombres by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var vacunas by remember { mutableStateOf("") }
    var enfermedad by remember { mutableStateOf("") }
    var observaciones by remember { mutableStateOf("") }

    var attemptedSubmit by remember { mutableStateOf(false) }
    var showSuccessModal by remember { mutableStateOf(false) }
    var savedIdEncuesta by remember { mutableStateOf("") }

    var existingPersona by remember { mutableStateOf<PersonaEntity?>(null) }
    var latestHistorial by remember { mutableStateOf<HistorialEntity?>(null) }
    var showHistoryDetails by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Cargar datos previos si el ciudadano ya existe en la BD local
    LaunchedEffect(documento) {
        try {
            val db = AppDatabase.getDatabase(context)
            val repo = EncuestasRepositoryImpl(db)
            val persona = repo.getPersona(documento)
            if (persona != null) {
                existingPersona = persona
                nombres = persona.primerNombre
                apellidos = persona.primerApellido
            }
            val historial = repo.getLatestHistorial(documento)
            if (historial != null) {
                latestHistorial = historial
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    val nombresError = attemptedSubmit && nombres.isBlank()
    val apellidosError = attemptedSubmit && apellidos.isBlank()

    // Modal de Éxito al Guardar
    if (showSuccessModal) {
        AlertDialog(
            onDismissRequest = { /* Forzar selección de botón */ },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(56.dp)
                )
            },
            title = {
                Text(
                    text = "¡Encuesta Guardada en Dispositivo!",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Los datos se han guardado localmente de forma segura en la base de datos cifrada.")
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    Text("• Ciudadano: $nombres $apellidos", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                    Text("• Documento: $documento", style = MaterialTheme.typography.bodySmall)
                    Text("• ID Encuesta: ${savedIdEncuesta.take(8)}...", style = MaterialTheme.typography.bodySmall)
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                    ) {
                        Text(
                            text = "En cola de sincronización automática",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessModal = false
                        onFormSaved()
                    },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Continuar a Búsqueda")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Encuesta en Campo", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Atrás")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    SyncStatusBadge(modifier = Modifier.padding(end = 8.dp))
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Banner de Registro Existente vs Nuevo
                if (existingPersona != null) {
                    Surface(
                        color = MaterialTheme.colorScheme.tertiaryContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.onTertiaryContainer)
                            Text(
                                text = "Ciudadano previamente registrado. Se actualizará la encuesta usando Smart Merge.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        }
                    }
                }

                // Sección 1: Datos Identificación
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    shadowElevation = 4.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(bottom = 16.dp)
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = CircleShape
                            ) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(8.dp))
                            }
                            Column {
                                Text(
                                    text = "Datos del Ciudadano",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Documento: $documento",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        OutlinedTextField(
                            value = nombres,
                            onValueChange = { nombres = it },
                            label = { Text("Nombres Completos") },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth(),
                            isError = nombresError,
                            supportingText = { if (nombresError) Text("El nombre es requerido") },
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = apellidos,
                            onValueChange = { apellidos = it },
                            label = { Text("Apellidos Completos") },
                            leadingIcon = { Icon(Icons.Default.Badge, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth(),
                            isError = apellidosError,
                            supportingText = { if (apellidosError) Text("El apellido es requerido") },
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )
                    }
                }

                // Sección 2: Datos Clínicos y Observaciones
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    shadowElevation = 4.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(bottom = 16.dp)
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = CircleShape
                            ) {
                                Icon(Icons.Default.LocalHospital, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(8.dp))
                            }
                            Text(
                                text = "Información de Salud y Campo",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        OutlinedTextField(
                            value = vacunas,
                            onValueChange = { vacunas = it },
                            label = { Text("Vacunas Aplicadas (Opcional)") },
                            placeholder = { Text("Ej: COVID-19, Influenza, Hepatitis") },
                            leadingIcon = { Icon(Icons.Default.Vaccines, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = enfermedad,
                            onValueChange = { enfermedad = it },
                            label = { Text("Enfermedad o Síntomas Actuales (Opcional)") },
                            placeholder = { Text("Ej: Hipertensión, Fiebre") },
                            leadingIcon = { Icon(Icons.Default.LocalHospital, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = observaciones,
                            onValueChange = { observaciones = it },
                            label = { Text("Observaciones de la Visita") },
                            leadingIcon = { Icon(Icons.Default.Description, contentDescription = null) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp),
                            maxLines = 4,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }

                // Botón Guardar
                Button(
                    onClick = {
                        attemptedSubmit = true
                        if (nombres.isBlank() || apellidos.isBlank()) return@Button

                        scope.launch {
                            try {
                                val db = AppDatabase.getDatabase(context)
                                val repo = EncuestasRepositoryImpl(db)

                                val idEncuesta = UUID.randomUUID().toString()
                                savedIdEncuesta = idEncuesta

                                val latest = repo.getLatestHistorial(documento)
                                val versionAnteriorId = latest?.idHistorial
                                val fechaEncuesta = System.currentTimeMillis()

                                val persona = PersonaEntity(
                                    numeroDocumento = documento,
                                    primerNombre = nombres,
                                    primerApellido = apellidos,
                                    syncVersion = latest?.idHistorial?.let { 2L } ?: 1L,
                                    syncStatus = "pending",
                                    updatedAt = System.currentTimeMillis()
                                )

                                val jsonMap = mutableMapOf<String, String?>()
                                if (vacunas.isNotBlank()) jsonMap["vacunas"] = vacunas
                                if (enfermedad.isNotBlank()) jsonMap["enfermedad"] = enfermedad
                                if (observaciones.isNotBlank()) jsonMap["observaciones"] = observaciones

                                val gson = Gson()
                                val jsonPayload = gson.toJson(jsonMap)

                                val historial = HistorialEntity(
                                    idHistorial = idEncuesta,
                                    numeroDocumentoPersona = documento,
                                    datosRecolectados = jsonPayload,
                                    fechaEncuesta = fechaEncuesta,
                                    fechaSincronizacion = null,
                                    versionAnteriorId = versionAnteriorId
                                )

                                val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                                    timeZone = TimeZone.getTimeZone("UTC")
                                }

                                val syncMap = mutableMapOf<String, Any>(
                                    "idEncuesta" to idEncuesta,
                                    "numeroDocumento" to documento,
                                    "datosRecolectados" to jsonPayload,
                                    "fechaEncuesta" to isoDateFormat.format(Date(fechaEncuesta))
                                )
                                if (versionAnteriorId != null) {
                                    syncMap["versionAnteriorId"] = versionAnteriorId
                                }
                                val syncPayload = gson.toJson(syncMap)

                                repo.guardarEncuestaOfflineAtomo(persona, historial, syncPayload)
                                showSuccessModal = true
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.padding(end = 8.dp))
                    Text("Guardar Encuesta (Offline)", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }

                Spacer(modifier = Modifier.height(30.dp))
            }
        }
    }
}
