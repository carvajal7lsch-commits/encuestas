<#
.SYNOPSIS
    Compila, firma y publica la APK de EncuestasOffline en un solo comando.

.DESCRIPTION
    Reemplaza el paso manual por Android Studio. Hace todo el ciclo:
      1. Sube el versionCode / versionName (opcional, con -Bump).
      2. Compila el APK de release y lo firma con encuestas-release.jks.
      3. Lo copia a frontend/public/ para que lo sirva el sitio.
      4. Genera frontend/public/app-version.json, que es lo que la app instalada
         consulta al abrirse para saber que hay versión nueva.
      5. Opcionalmente commitea y hace push (con -Publicar), lo que dispara el
         redespliegue del frontend en el VPS.

    Las notas de la versión salen de Encuestasoffline/release-notes.txt
    (una por línea). Se muestran dentro del diálogo de actualización.

.PARAMETER Bump
    Incrementa versionCode en 1 y sube el último número del versionName.

.PARAMETER Version
    Fija un versionName explícito (ej. 1.2.0). Implica -Bump del versionCode.

.PARAMETER Publicar
    Hace git add/commit/push de la APK y el manifiesto al terminar.

.EXAMPLE
    .\scripts\publicar-apk.ps1 -Bump -Publicar
    Sube la versión, compila, firma, publica y empuja al repo.

.EXAMPLE
    .\scripts\publicar-apk.ps1
    Recompila la versión actual sin tocar números ni git.
#>
[CmdletBinding()]
param(
    [switch]$Bump,
    [string]$Version,
    [switch]$Publicar
)

$ErrorActionPreference = 'Stop'

$raiz        = Split-Path -Parent $PSScriptRoot
$dirAndroid  = Join-Path $raiz 'Encuestasoffline'
$gradleFile  = Join-Path $dirAndroid 'app\build.gradle.kts'
$keystoreCfg = Join-Path $dirAndroid 'keystore.properties'
$notasFile   = Join-Path $dirAndroid 'release-notes.txt'
$publicDir   = Join-Path $raiz 'frontend\public'
$apkPublico  = Join-Path $publicDir 'EncuestasOffline.apk'
$manifiesto  = Join-Path $publicDir 'app-version.json'

# URL pública desde la que el celular descarga la actualización.
$baseUrl = 'https://encuestas.secarvajal.com'

function Escribir($mensaje, $color = 'Cyan') {
    Write-Host "  $mensaje" -ForegroundColor $color
}

Write-Host "`n== Publicación de APK — EncuestasOffline ==`n" -ForegroundColor White

# --- 0. Requisitos -----------------------------------------------------------
if (-not (Test-Path $keystoreCfg)) {
    throw "Falta $keystoreCfg. Sin keystore el APK sale sin firmar y Android no lo instala."
}
if (-not (Test-Path $gradleFile)) {
    throw "No se encontró $gradleFile."
}

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

    Escribir "Versión: $versionName ($versionCode)  ->  $nuevoName ($nuevoCode)" 'Yellow'
    $versionCode = $nuevoCode
    $versionName = $nuevoName
} else {
    Escribir "Versión: $versionName ($versionCode)  [sin cambios]"
}

# --- 2. Compilar y firmar ----------------------------------------------------
Escribir 'Compilando APK de release (puede tardar unos minutos)...'

Push-Location $dirAndroid
try {
    & .\gradlew.bat assembleRelease --console=plain -q
    if ($LASTEXITCODE -ne 0) { throw "La compilación de Gradle falló (código $LASTEXITCODE)." }
} finally {
    Pop-Location
}

# El build está redirigido fuera de OneDrive (ver app/build.gradle.kts).
$dirBuild = Join-Path $env:USERPROFILE '.gradle_build_encuestas\app\outputs\apk\release'
$apk = Get-ChildItem -Path $dirBuild -Filter '*.apk' -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending |
       Select-Object -First 1

if (-not $apk) { throw "No se encontró ningún APK en $dirBuild." }
if ($apk.Name -match 'unsigned') {
    throw "El APK salió SIN FIRMAR ($($apk.Name)). Revisa $keystoreCfg."
}

$tamanoMb = [math]::Round($apk.Length / 1MB, 1)
Escribir "APK firmado: $($apk.Name) ($tamanoMb MB)" 'Green'

# --- 3. Publicar en el frontend ---------------------------------------------
if (-not (Test-Path $publicDir)) { throw "No existe $publicDir." }
Copy-Item $apk.FullName $apkPublico -Force
Escribir "Copiado a frontend/public/EncuestasOffline.apk"

# --- 4. Manifiesto que consulta la app --------------------------------------
$notas = @()
if (Test-Path $notasFile) {
    $notas = @(Get-Content $notasFile -Encoding utf8 |
               Where-Object { $_.Trim() -ne '' } |
               ForEach-Object { $_.Trim() })
}
if ($notas.Count -eq 0) { $notas = @('Mejoras de estabilidad y corrección de errores.') }

$info = [ordered]@{
    versionCode  = $versionCode
    versionName  = $versionName
    apkUrl       = "$baseUrl/EncuestasOffline.apk"
    tamanoMb     = $tamanoMb
    obligatoria  = $false
    publicadaEn  = (Get-Date).ToString('yyyy-MM-dd')
    notas        = $notas
}

# UTF-8 SIN BOM a proposito: Set-Content -Encoding utf8 en PowerShell 5.1
# antepone el BOM y el parser JSON de la app Android lo rechaza.
$sinBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifiesto, ($info | ConvertTo-Json -Depth 4), $sinBom)
Escribir "Manifiesto escrito: frontend/public/app-version.json"

# --- 5. Push opcional --------------------------------------------------------
if ($Publicar) {
    Escribir 'Subiendo cambios al repositorio...'
    Push-Location $raiz
    try {
        git add $apkPublico $manifiesto $gradleFile
        git commit -m "chore(apk): publicar version $versionName ($versionCode)"
        if ($LASTEXITCODE -ne 0) { throw 'git commit falló.' }
        git push
        if ($LASTEXITCODE -ne 0) { throw 'git push falló.' }
        Escribir 'Publicado. El VPS redesplegará el frontend.' 'Green'
    } finally {
        Pop-Location
    }
}

Write-Host "`nListo — version $versionName ($versionCode)." -ForegroundColor Green
if (-not $Publicar) {
    Write-Host "Para publicarlo: git add frontend/public && git commit && git push" -ForegroundColor DarkGray
}
Write-Host "Los celulares con la app instalada verán el aviso al abrirla.`n" -ForegroundColor DarkGray
