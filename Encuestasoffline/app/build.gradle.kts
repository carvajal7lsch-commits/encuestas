import java.io.FileInputStream
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.ksp)
    alias(libs.plugins.kotlin.compose)
}

// Credenciales de firma. En tu equipo salen de Encuestasoffline/keystore.properties
// (ignorado por git); en GitHub Actions, de variables de entorno con los secretos.
// La firma DEBE ser siempre la misma: si cambia, Android rechaza la actualizaciÃ³n
// sobre la app ya instalada y obliga a desinstalar.
val propiedadesFirma = Properties().apply {
    val archivo = rootProject.file("keystore.properties")
    if (archivo.exists()) FileInputStream(archivo).use { load(it) }
}

fun datoDeFirma(clave: String, variableEntorno: String): String? =
    propiedadesFirma.getProperty(clave) ?: System.getenv(variableEntorno)

// Redirigir carpeta de compilaciÃ³n fuera de OneDrive para evitar bloqueos de archivos en Windows
layout.buildDirectory.set(file("${System.getProperty("user.home")}/.gradle_build_encuestas/app"))

android {
    namespace = "com.minsalud.encuestas"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.minsalud.encuestas"
        minSdk = 24
        targetSdk = 36
        // SÃºbelos en cada publicaciÃ³n: el instalador de Android y el chequeo de
        // actualizaciÃ³n de la app comparan contra versionCode.
        versionCode = 3
        versionName = "1.2.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    signingConfigs {
        create("release") {
            val ruta = datoDeFirma("storeFile", "KEYSTORE_FILE")
            if (ruta != null) {
                storeFile = rootProject.file(ruta)
                storePassword = datoDeFirma("storePassword", "KEYSTORE_PASSWORD")
                keyAlias = datoDeFirma("keyAlias", "KEY_ALIAS")
                keyPassword = datoDeFirma("keyPassword", "KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Sin keystore configurado se deja sin firmar en vez de romper el build,
            // para que `assembleDebug` y las pruebas sigan corriendo en limpio.
            signingConfig = if (datoDeFirma("storeFile", "KEYSTORE_FILE") != null) {
                signingConfigs.getByName("release")
            } else {
                null
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

ksp {
    arg("room.generateKotlin", "true")
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.ktx)
    implementation(libs.material)
    
    // Compose
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation("androidx.compose.material:material-icons-extended")
    implementation(libs.activity.compose)
    implementation(libs.navigation.compose)
    
    debugImplementation(libs.compose.ui.tooling)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)

    // --- Dependencias Agregadas para el Proyecto Antigravity ---
    
    // Retrofit (Red)
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.gson)
    
    // Room (Local SQLite)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")
    
    // WorkManager (Background Sync)
    implementation(libs.work.runtime.ktx)

    // ViewModel & Coroutines
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Google Fonts for Compose
    implementation("androidx.compose.ui:ui-text-google-fonts:1.6.8")

    // SQLCipher para cifrar Room
    implementation("net.zetetic:android-database-sqlcipher:4.5.4")
    implementation("androidx.sqlite:sqlite-ktx:2.4.0")
}