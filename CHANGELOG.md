# Changelog

Este archivo resume cambios publicados. Las versiones siguen [Semantic
Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Operación e infraestructura
- Normalización del entorno a Node 22.12.0 vía `.nvmrc` y `package.json`.
- Separación de `pnpm build` respecto a `pnpm db:migrate:deploy`.
- Agregados scripts `prisma:validate`, `db:migrate:status`, `env:check` y `build:production`.
- Creación de `Dockerfile` standalone optimizado y `.dockerignore`.
- Workflow de integración continua en GitHub Actions (`.github/workflows/ci.yml`).
- Guías operativas de despliegue en Vercel y respaldo/restauración de Neon.

### Seguridad y autorización
- Matriz formal de permisos por rol (`ADMIN`, `ASESOR`, `MANTENIMIENTO`) en `src/lib/permissions.ts`.
- Validación estricta y directa de permisos en Server Actions (`requirePermission`), eliminando dependencia exclusiva del middleware.
- Verificación de sesión requerida en consultas de auditoría (`listarActividadInmueble`, `listarActividadTarea`).

### Correcciones y estabilidad
- Corrección de TOCTOU en `liberarTarea` y `completarTarea` generales mediante `updateMany` condicional atómico.
- Corrección de paginación por cursor en `listMantenimientoTareas`.
- Validación de fecha calendario y rango (hoy a 5 años en zona `America/Bogota`) en `src/lib/task-date.ts`.
- Corrección de símbolo en auditoría de inmuebles restaurados.
- Adaptación de enlaces de inmuebles en módulo de mantenimiento para evitar bucles de redirección en rol `MANTENIMIENTO`.
- Cobertura de pruebas unitarias ampliada a 12 suites (125 pruebas pasando).
