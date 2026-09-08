<#
.SYNOPSIS
    Compila, firma y publica la APK de EncuestasOffline en un solo comando.

.DESCRIPTION
    Reemplaza el paso manual por Android Studio. Hace todo el ciclo:
      1. Sube el versionCode / versionName (opcional, con -Bump).
      2. Compila el APK de release y lo firma con encuestas-release.jks.
      3. Publica el APK como asset de un GitHub Release (tag vX.Y.Z).
      4. Genera frontend/public/app-version.json apuntando a ese asset, que es
         lo que la app instalada consulta al abrirse para saber que hay version
         nueva.
      5. Commitea y sube el manifiesto, lo que dispara el redespliegue del
         frontend en el VPS.

    El APK NO se commitea: vive en el Release. Cada version publicada solia
    agregar ~26 MB permanentes al historial de git, lo que hacia los push
    lentos y propensos a fallar con HTTP 408.

    Las notas de la version salen de Encuestasoffline/release-notes.txt
    (una por linea). Se muestran dentro del dialogo de actualizacion.

.PARAMETER Bump
    Incrementa versionCode en 1 y sube el ultimo numero del versionName.

.PARAMETER Version
    Fija un versionName explicito (ej. 1.2.0). Implica -Bump del versionCode.

.PARAMETER Publicar
    Crea el GitHub Release y hace commit/push del manifiesto. Sin esta bandera
    solo compila y firma, para poder probar el APK antes de publicarlo.

.PARAMETER Borrador
    Crea el Release como borrador, para revisarlo antes de hacerlo publico.

.EXAMPLE
    .\scripts\publicar-apk.ps1 -Bump -Publicar
    Sube la version, compila, firma, crea el Release y publica el manifiesto.

.EXAMPLE
    .\scripts\publicar-apk.ps1
    Solo compila y firma la version actual, sin publicar nada.
#>
[CmdletBinding()]
param(
    [switch]$Bump,
    [string]$Version,
    [switch]$Publicar,
    [switch]$Borrador
)

$ErrorActionPreference = 'Stop'

$raiz        = Split-Path -Parent $PSScriptRoot
$dirAndroid  = Join-Path $raiz 'Encuestasoffline'
$gradleFile  = Join-Path $dirAndroid 'app\build.gradle.kts'
$keystoreCfg = Join-Path $dirAndroid 'keystore.properties'
$notasFile   = Join-Path $dirAndroid 'release-notes.txt'
$manifiesto  = Join-Path $raiz 'frontend\public\app-version.json'
$generador   = Join-Path $PSScriptRoot 'escribir-manifiesto.py'

# Nombre con el que se sube el asset al Release.
$nombreAsset = 'EncuestasOffline.apk'

function Escribir($mensaje, $color = 'Cyan') {
    Write-Host "  $mensaje" -ForegroundColor $color
}

<#
    Ejecuta un programa externo y devuelve su codigo de salida.

    Windows PowerShell 5.1 convierte cada linea del stderr de un ejecutable en
    un ErrorRecord; con $ErrorActionPreference = 'Stop' eso aborta el script
    aunque el programa haya terminado bien. Y varias herramientas usan stderr
    para cosas normales: gh reporta ahi el progreso de subida y gradle sus
    advertencias. Por eso se baja la preferencia solo mientras corre el
    programa y el exito se decide por el codigo de salida, no por el stderr.
#>
function Invocar {
    param(
        [Parameter(Mandatory)][string]$Programa,
        [string[]]$Argumentos = @(),
        [switch]$Silencioso
    )

    $previo = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Silencioso) {
            & $Programa @Argumentos 2>&1 | Out-Null
        } else {
            # El "$_" convierte los ErrorRecord del stderr en texto normal,
            # para que la salida no se pinte como si todo hubiera fallado.
            & $Programa @Argumentos 2>&1 | ForEach-Object { "$_" }
        }
        return $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previo
    }
}

# Igual que Invocar, pero devuelve la salida en vez de imprimirla.
function InvocarCapturando {
    param(
        [Parameter(Mandatory)][string]$Programa,
        [string[]]$Argumentos = @()
    )

    $previo = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $salida = & $Programa @Argumentos 2>$null
        return ($salida | Out-String).Trim()
    } finally {
        $ErrorActionPreference = $previo
    }
}

Write-Host "`n== Publicacion de APK - EncuestasOffline ==`n" -ForegroundColor White

# --- 0. Requisitos -----------------------------------------------------------
if (-not (Test-Path $keystoreCfg)) {
    throw "Falta $keystoreCfg. Sin keystore el APK sale sin firmar y Android no lo instala."
}
if (-not (Test-Path $gradleFile)) {
    throw "No se encontro $gradleFile."
}

if ($Publicar) {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw 'Falta GitHub CLI (gh). Instalalo desde https://cli.github.com para poder publicar Releases.'
    }
    if ((Invocar -Programa 'gh' -Argumentos @('auth', 'status') -Silencioso) -ne 0) {
        throw 'GitHub CLI no esta autenticado. Ejecuta "gh auth login" una vez y vuelve a intentar.'
    }
}

# Slug del repositorio, leido del remoto para no quemarlo en el script.
$remoto = InvocarCapturando -Programa 'git' -Argumentos @('-C', $raiz, 'remote', 'get-url', 'origin')
if ($remoto -notmatch 'github\.com[:/](?<slug>[^/]+/[^/\.]+)') {
    throw "No se pudo deducir el repositorio de GitHub desde el remoto: $remoto"
}
$slug = $Matches['slug']

# --- 1. Versionado -----------------------------------------------------------
$gradle = Get-Content $gradleFile -Raw

if (-not ($gradle -match 'versionCode\s*=\s*(\d+)')) { throw 'No se pudo leer versionCode.' }
$versionCode = [int]$Matches[1]

if (-not ($gradle -match 'versionName\s*=\s*"([^"]+)"')) { throw 'No se pudo leer versionName.' }
$versionName = $Matches[1]

if ($Bump -or $Version) {
    $nuevoCode = $versionCode + 1

    if ($Version) {
        $nuevoName = $Version
    } else {
        # 1.1.0 -> 1.1.1
        $partes = $versionName.Split('.')
        $partes[-1] = [string]([int]$partes[-1] + 1)
        $nuevoName = $partes -join '.'
    }

    $gradle = $gradle -replace 'versionCode\s*=\s*\d+', "versionCode = $nuevoCode"
    $gradle = $gradle -replace 'versionName\s*=\s*"[^"]+"', "versionName = `"$nuevoName`""
    Set-Content -Path $gradleFile -Value $gradle -Encoding utf8 -NoNewline

    Escribir "Version: $versionName ($versionCode)  ->  $nuevoName ($nuevoCode)" 'Yellow'
    $versionCode = $nuevoCode
    $versionName = $nuevoName
} else {
    Escribir "Version: $versionName ($versionCode)  [sin cambios]"
}

$tag = "v$versionName"

# El tag no puede existir ya: seria una version distinta con el mismo nombre.
if ($Publicar) {
    if ((Invocar -Programa 'gh' -Argumentos @('release', 'view', $tag, '--repo', $slug) -Silencioso) -eq 0) {
        throw "El release $tag ya existe en $slug. Usa -Bump o -Version para publicar una version nueva."
    }
}

# --- 2. Compilar y firmar ----------------------------------------------------
Escribir 'Compilando APK de release (puede tardar unos minutos)...'

Push-Location $dirAndroid
try {
    $codigo = Invocar -Programa '.\gradlew.bat' -Argumentos @('assembleRelease', '--console=plain', '-q')
    if ($codigo -ne 0) { throw "La compilacion de Gradle fallo (codigo $codigo)." }
} finally {
    Pop-Location
}

# El build esta redirigido fuera de OneDrive (ver app/build.gradle.kts).
$dirBuild = Join-Path $env:USERPROFILE '.gradle_build_encuestas\app\outputs\apk\release'
$apk = Get-ChildItem -Path $dirBuild -Filter '*.apk' -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending |
       Select-Object -First 1

if (-not $apk) { throw "No se encontro ningun APK en $dirBuild." }
if ($apk.Name -match 'unsigned') {
    throw "El APK salio SIN FIRMAR ($($apk.Name)). Revisa $keystoreCfg."
}

$tamanoMb = [math]::Round($apk.Length / 1MB, 1)
Escribir "APK firmado: $($apk.Name) ($tamanoMb MB)" 'Green'

# Se copia a un nombre estable para que el asset del Release no se llame
# "app-release.apk" al descargarlo.
$apkParaSubir = Join-Path $env:TEMP $nombreAsset
Copy-Item $apk.FullName $apkParaSubir -Force

if (-not $Publicar) {
    Write-Host "`nCompilado sin publicar." -ForegroundColor Green
    Write-Host "APK listo en: $apkParaSubir" -ForegroundColor DarkGray
    Write-Host "Para publicarlo: .\scripts\publicar-apk.ps1 -Publicar`n" -ForegroundColor DarkGray
    return
}

# --- 3. Publicar el Release --------------------------------------------------
Escribir "Creando release $tag en $slug..."

$notasRelease = Join-Path $env:TEMP 'encuestas-release-notes.md'
if (Test-Path $notasFile) {
    $lineas = Get-Content $notasFile -Encoding utf8 | Where-Object { $_.Trim() -ne '' }
    ($lineas | ForEach-Object { "- $($_.Trim())" }) -join "`n" |
        Set-Content -Path $notasRelease -Encoding utf8
} else {
    'Mejoras de estabilidad y correccion de errores.' | Set-Content -Path $notasRelease -Encoding utf8
}

$argsRelease = @(
    'release', 'create', $tag, $apkParaSubir,
    '--repo', $slug,
    '--title', "EncuestasOffline $versionName",
    '--notes-file', $notasRelease
)
if ($Borrador) { $argsRelease += '--draft' }

if ((Invocar -Programa 'gh' -Argumentos $argsRelease) -ne 0) {
    throw 'No se pudo crear el GitHub Release.'
}

$urlApk = "https://github.com/$slug/releases/download/$tag/$nombreAsset"
Escribir 'Release publicado' 'Green'

# --- 4. Manifiesto que consulta la app --------------------------------------
$argsManifiesto = @($generador, $versionCode, $versionName, $apkParaSubir, $urlApk)
if ((Invocar -Programa 'python' -Argumentos $argsManifiesto) -ne 0) {
    throw 'No se pudo generar el manifiesto.'
}

# --- 5. Push del manifiesto (unos cientos de bytes) --------------------------
Escribir 'Subiendo el manifiesto al repositorio...'
Push-Location $raiz
try {
    if ((Invocar -Programa 'git' -Argumentos @('add', $manifiesto, $gradleFile)) -ne 0) {
        throw 'git add fallo.'
    }
    $mensaje = "chore(apk): publicar version $versionName ($versionCode)"
    if ((Invocar -Programa 'git' -Argumentos @('commit', '-m', $mensaje)) -ne 0) {
        throw 'git commit fallo.'
    }
    if ((Invocar -Programa 'git' -Argumentos @('push')) -ne 0) {
        throw 'git push fallo.'
    }
    Escribir 'Publicado. El VPS redesplegara el frontend.' 'Green'
} finally {
    Pop-Location
}

Remove-Item $apkParaSubir -Force -ErrorAction SilentlyContinue

Write-Host "`nListo - version $versionName ($versionCode)." -ForegroundColor Green
Write-Host "Los celulares con la app instalada veran el aviso al abrirla.`n" -ForegroundColor DarkGray
