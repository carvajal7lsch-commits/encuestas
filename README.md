# Sistema de Encuestas Offline — Encuestas Offline de Salud

Sistema de encuestas con sincronización inteligente para zonas sin
conectividad. Proyecto SENA — Tecnología en Análisis y Desarrollo de
Software, Ficha 3142784.

## Arquitectura

- **App móvil**: Android nativo (Kotlin, MVVM, Room, WorkManager, Retrofit)
- **Backend**: Node.js + Express + TypeScript
- **Frontend Web**: React + Vite + TypeScript (Dashboard de Administración)
- **Base de datos**: PostgreSQL

Ver `/antigravity_project/docs/PROJECT_CONTEXT.md` para el diseño arquitectónico completo.

## Estructura del repositorio

```
/android                    → app Android (Kotlin)
/backend                    → API REST (Node.js + TypeScript)
/frontend                   → Dashboard de Administración (React + Vite)
/antigravity_project/docs   → documentación de diseño (brief, base de datos, API)
```

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+
- Android Studio (última versión estable) con SDK 26+
- npm o yarn

## Instalación — Backend

```bash
cd backend
npm install
# Completar valores reales en archivo .env (ver docs/DEPLOYMENT.md)
# Ejecutar script DDL en PostgreSQL: psql -U encuestas_user -d encuestas_db -f ../antigravity_project/docs/sql/schema_servidor.sql
npm run dev              # levanta en modo desarrollo
```

## Instalación — Frontend (Dashboard Admin)

```bash
cd frontend
npm install
npm run dev              # inicia Vite server en http://localhost:5173
```

## Instalación — App Android

1. Abrir el directorio del proyecto móvil en Android Studio.
2. Hacer un "Sync Project with Gradle Files".
3. Compilar y ejecutar en un emulador o dispositivo físico (API 26+ recomendada).


