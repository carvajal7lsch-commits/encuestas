"""Genera frontend/public/app-version.json, el manifiesto que la app instalada
consulta al abrirse para saber si hay una versión nueva publicada.

Lo usa el workflow "Publicar APK" de GitHub Actions. Para publicar desde tu
equipo usa scripts/publicar-apk.ps1, que hace lo mismo junto con la compilación.

Uso:
    python scripts/escribir-manifiesto.py <versionCode> <versionName> [notas]

Las notas se separan con " | ". Si no se pasan, se leen de
Encuestasoffline/release-notes.txt (una por línea).
"""

import datetime
import json
import os
import sys

BASE_URL = "https://encuestas.secarvajal.com"

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APK = os.path.join(RAIZ, "frontend", "public", "EncuestasOffline.apk")
MANIFIESTO = os.path.join(RAIZ, "frontend", "public", "app-version.json")
NOTAS_TXT = os.path.join(RAIZ, "Encuestasoffline", "release-notes.txt")


def leer_notas(argumento: str) -> list[str]:
    if argumento.strip():
        notas = [n.strip() for n in argumento.split("|") if n.strip()]
        if notas:
            return notas

    try:
        with open(NOTAS_TXT, encoding="utf-8") as archivo:
            notas = [linea.strip() for linea in archivo if linea.strip()]
    except FileNotFoundError:
        notas = []

    return notas or ["Mejoras de estabilidad y corrección de errores."]


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2

    version_code = int(sys.argv[1])
    version_name = sys.argv[2]
    notas = leer_notas(sys.argv[3] if len(sys.argv) > 3 else "")

    if not os.path.exists(APK):
        print(f"No se encontró el APK publicado en {APK}", file=sys.stderr)
        return 1

    info = {
        "versionCode": version_code,
        "versionName": version_name,
        "apkUrl": f"{BASE_URL}/EncuestasOffline.apk",
        "tamanoMb": round(os.path.getsize(APK) / 1048576, 1),
        "obligatoria": False,
        "publicadaEn": datetime.date.today().isoformat(),
        "notas": notas,
    }

    with open(MANIFIESTO, "w", encoding="utf-8") as archivo:
        json.dump(info, archivo, ensure_ascii=False, indent=2)
        archivo.write("\n")

    print(f"Manifiesto escrito: {version_name} ({version_code}), {info['tamanoMb']} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
