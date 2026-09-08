"""Genera frontend/public/app-version.json, el manifiesto que la app instalada
consulta al abrirse para saber si hay una version nueva publicada.

El manifiesto lo sigue sirviendo el sitio propio (pesa menos de 1 KB), pero el
APK ya no vive en el repositorio: se publica como asset de un GitHub Release y
el manifiesto apunta alli. Asi el historial de git deja de crecer ~26 MB por
cada version publicada.

Lo usan scripts/publicar-apk.ps1 y el workflow "Publicar APK".

Uso:
    python scripts/escribir-manifiesto.py <versionCode> <versionName> <rutaApk> <urlApk> [notas]

Las notas se separan con " | ". Si no se pasan, se leen de
Encuestasoffline/release-notes.txt (una por linea).
"""

import datetime
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFIESTO = os.path.join(RAIZ, "frontend", "public", "app-version.json")
NOTAS_TXT = os.path.join(RAIZ, "Encuestasoffline", "release-notes.txt")


def leer_notas(argumento):
    if argumento.strip():
        notas = [n.strip() for n in argumento.split("|") if n.strip()]
        if notas:
            return notas

    try:
        with open(NOTAS_TXT, encoding="utf-8") as archivo:
            notas = [linea.strip() for linea in archivo if linea.strip()]
    except FileNotFoundError:
        notas = []

    return notas or ["Mejoras de estabilidad y correccion de errores."]


def main() -> int:
    if len(sys.argv) < 5:
        print(__doc__)
        return 2

    version_code = int(sys.argv[1])
    version_name = sys.argv[2]
    ruta_apk = sys.argv[3]
    url_apk = sys.argv[4]
    notas = leer_notas(sys.argv[5] if len(sys.argv) > 5 else "")

    if not os.path.exists(ruta_apk):
        print(f"No se encontro el APK en {ruta_apk}", file=sys.stderr)
        return 1

    info = {
        "versionCode": version_code,
        "versionName": version_name,
        # URL fija de esta version concreta, no la de "latest": el celular debe
        # descargar exactamente la version que el manifiesto le anuncio.
        "apkUrl": url_apk,
        "tamanoMb": round(os.path.getsize(ruta_apk) / 1048576, 1),
        "obligatoria": False,
        "publicadaEn": datetime.date.today().isoformat(),
        "notas": notas,
    }

    # Sin BOM: el parser JSON de la app Android lo rechaza.
    with open(MANIFIESTO, "w", encoding="utf-8", newline="\n") as archivo:
        json.dump(info, archivo, ensure_ascii=False, indent=2)
        archivo.write("\n")

    print(f"Manifiesto escrito: {version_name} ({version_code}), {info['tamanoMb']} MB")
    print(f"  apkUrl -> {url_apk}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
