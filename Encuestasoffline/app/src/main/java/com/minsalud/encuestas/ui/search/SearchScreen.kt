package com.minsalud.encuestas.ui.search

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.minsalud.encuestas.data.local.AppDatabase
import com.minsalud.encuestas.data.local.entity.PersonaEntity
import com.minsalud.encuestas.data.repository.EncuestasRepositoryImpl
import com.minsalud.encuestas.ui.components.SyncStatusBadge
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    onPersonFound: (String) -> Unit,
    onLogout: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var attemptedSubmit by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var recentPersonas by remember { mutableStateOf<List<PersonaEntity>>(emptyList()) }

    val context = LocalContext.current

    LaunchedEffect(Unit) {
        try {
            val db = AppDatabase.getDatabase(context)
            val repo = EncuestasRepositoryImpl(db)
            repo.obtenerTodasLasPersonas().collectLatest { personas ->
                recentPersonas = personas
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    val isNumeric = searchQuery.all { it.isDigit() }
    val isLengthValid = searchQuery.length in 5..15
    val hasError = attemptedSubmit && (searchQuery.isBlank() || !isNumeric || !isLengthValid)

    val errorMessage = when {
        searchQuery.isBlank() -> "El documento es requerido"
        !isNumeric -> "Debe contener solo números"
        !isLengthValid -> "Debe tener entre 5 y 15 dígitos"
        else -> ""
    }

    // Diálogo de Confirmación de Cierre de Sesión
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            icon = { Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("¿Cerrar Sesión?") },
            text = { Text("Los datos de encuestas guardadas localmente se mantendrán seguros en el dispositivo.") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Sí, Cerrar Sesión")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancelar")
                }
            }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    shadowElevation = 6.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(
                        modifier = Modifier.padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = CircleShape,
                            modifier = Modifier.padding(bottom = 16.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = null,
                                modifier = Modifier
                                    .size(68.dp)
                                    .padding(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }

                        Text(
                            text = "Nueva Encuesta en Campo",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Ingrese la cédula para iniciar o actualizar la encuesta",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
                        )

                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            label = { Text("Número de Documento") },
                            leadingIcon = {
                                Icon(Icons.Default.Badge, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            isError = hasError,
                            supportingText = { if (hasError) Text(errorMessage) },
                            shape = RoundedCornerShape(14.dp)
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                attemptedSubmit = true
                                if (searchQuery.isNotBlank() && isNumeric && isLengthValid) {
                                    onPersonFound(searchQuery)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.padding(end = 8.dp))
                            Text("Buscar e Iniciar Encuesta", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }
            }

            // Sección de Encuestados Recientes
            if (recentPersonas.isNotEmpty()) {
                item {
                    Text(
                        text = "Ciudadanos Encuestados Localmente (${recentPersonas.size})",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                    )
                }

                items(recentPersonas) { persona ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPersonFound(persona.numeroDocumento) },
                        shape = RoundedCornerShape(16.dp),
                        tonalElevation = 2.dp,
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                shape = CircleShape
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(44.dp)
                                        .padding(10.dp),
                                    tint = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${persona.primerNombre} ${persona.primerApellido}",
                                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "CC: ${persona.numeroDocumento}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Surface(
                                color = if (persona.syncStatus == "synced") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.tertiaryContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = if (persona.syncStatus == "synced") "Sincronizado" else "Local",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (persona.syncStatus == "synced") MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onTertiaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
