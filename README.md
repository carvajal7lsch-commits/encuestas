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
/Encuestasoffline           → app Android (Kotlin)
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

## 🧪 Pruebas Unitarias y de Integración

El proyecto cuenta con suites de pruebas automatizadas tanto en el frontend como en el backend:

### Backend (Jest + ts-jest)
```bash
cd backend
npm run test           # Ejecuta la suite de pruebas unitarias
npm run test:coverage  # Ejecuta las pruebas con reporte de cobertura de código
```

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm run test           # Ejecuta la suite de pruebas del frontend
npm run test:coverage  # Ejecuta las pruebas con reporte de cobertura de código
```

## ⚙️ Integración Continua (CI)

Se ha configurado un flujo de integración continua utilizando **GitHub Actions** en `.github/workflows/ci.yml`. En cada `push` o `pull_request` a las ramas principales (`main`, `master`, `develop`), se ejecutan automáticamente las siguientes tareas:
1. Instalación limpia de dependencias.
2. Validación de formato y análisis estático (Linter / compiler).
3. Ejecución de la suite completa de pruebas unitarias.
4. Compilación del proyecto (`build`) para asegurar la ausencia de fallos sintácticos o de tipado.

## 🔒 Mejoras de Seguridad y Refactorización
- **Restricción de CORS:** Configuración robusta en el backend ([backend/src/index.ts](backend/src/index.ts)) limitando el acceso a orígenes autorizados configurables desde variables de entorno.
- **Rediseño de la Landing Page:** Reconstrucción completa en tema oscuro sobre un sistema de diseño propio (`landing-theme.css`), con revelado progresivo por `IntersectionObserver`, navegación móvil, mockup de la app renderizado en CSS y diagrama del Smart Merge. Secciones desacopladas: `LandingHeader`, `LandingHero`, `LandingSteps`, `LandingFeatures`, `SmartMergeInfo`, `LandingArchitecture`, `LandingFaq`, `LandingCta`, `LandingFooter` y `ApkModal`.

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**; consulta el archivo [LICENSE](LICENSE) para ver más detalles sobre su distribución y uso.



