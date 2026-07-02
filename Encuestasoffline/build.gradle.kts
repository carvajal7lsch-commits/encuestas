// Redirigir carpeta de compilación raíz fuera de OneDrive para evitar bloqueos de archivos en Windows
layout.buildDirectory.set(file("${System.getProperty("user.home")}/.gradle_build_encuestas/root"))

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.kotlin.compose) apply false
}