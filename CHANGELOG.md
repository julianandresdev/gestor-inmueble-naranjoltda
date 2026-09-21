# Changelog

Este archivo resume cambios publicados. Las versiones siguen [Semantic
Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Panel de Administración, Métricas y Registro de Accesos (Auditoría Avanzada)
- **Panel de Administración (`/administracion/panel`)**:
  - Vista exclusiva para administradores con protección `requireAdmin()`, selector temporal (`Hoy`, `7 días`, `30 días`) y badge en vivo.
  - **Banner de Alertas Críticas**: Detección automática de tareas vencidas (> 3 días), mantenimientos estancados (> 7 días sin actualización) e intentos fallidos de login repetidos (> 3 fallos en 24h).
  - **Tarjetas KPI**: Resumen integral de inmuebles (activos vs archivados, captaciones del periodo), tareas (pendientes, vencidas, completadas), mantenimientos abiertos y sin asignar, soporte urgente y usuarios en línea.
  - **Presencia en Tiempo Real**: Visualización de usuarios activos en vivo con indicador visual verde, rol, dispositivo, navegador, sistema operativo, IP real y ruta en la que están navegando.
  - **Desglose de Productividad por Asesor**: Tabla con volumen total de acciones por miembro del equipo, última acción realizada y desglose por módulo.
  - **Volumen de Actividad Diaria y por Módulo**: Gráficos SVG interactivos y barras proporcionales por módulo (Inmuebles, Tareas, Mantenimiento, Soporte, Usuarios).
  - **Seguridad y Auditoría de Accesos**: Totales de accesos exitosos, fallidos y cierres de sesión; tabla detallada de intentos fallidos recientes con IP y geolocalización (Vercel Geo); detección de accesos fuera de horario laboral (noches y fines de semana); historial de eventos sensibles (cambios de contraseña, estado de usuarios, archivos de inmuebles).
  - **Salud del Inventario**: Detección de inmuebles sin propietario, disponibles/sin arrendatario, desactualizados (> 90 días), y distribución por tipo y destinación.
  - **Carga Operativa de Tareas**: Carga de tareas por responsable, matriz de prioridad (urgente vs importante) y tasa de cumplimiento a tiempo.
  - **Mantenimiento y Soporte**: Antigüedad promedio de casos abiertos, distribución por prioridad y canal de contacto.
- **Registro de Accesos (`RegistroAcceso`) y Presencia (`SesionPresencia`)**:
  - Registro automático de eventos `LOGIN_EXITOSO`, `LOGIN_FALLIDO` (con motivo) y `LOGOUT`.
  - Captura de IP real de cliente (primer salto de `x-forwarded-for` o `x-real-ip`), geolocalización Vercel (`x-vercel-ip-country`, `x-vercel-ip-city`) y análisis de agente de usuario vía `ua-parser-js`.
  - Mecanismo de presencia en cliente (`PresenceHeartbeat`) con latido cada 60 segundos mientras la pestaña está visible.
- **Enriquecimiento de Auditoría y Protección de Privacidad**:
  - Inclusión de `ip`, `dispositivo` y `cambios` en la tabla `actividad`.
  - Cálculo de diffs no destructivos con enmascaramiento estricto de contraseñas, tokens y datos personales de clientes (`[MODIFICADO]`, `[DATO_PERSONAL_RESERVADO]`).
- **Inmutabilidad en 3 Capas y Política de Retención**:
  - Capa de aplicación: Funciones en `lib/audit.ts` sólo de inserción.
  - Capa de Prisma: Extensión `$extends` que bloquea `update`, `delete` y `upsert` en `actividad` y `registroAcceso` salvo contexto de purga.
  - Capa de PostgreSQL: Triggers en base de datos (`trg_proteger_inmutabilidad_actividad`, `trg_proteger_inmutabilidad_registro_accesos`) que rechazan cualquier `UPDATE` o `DELETE` sin la variable local `app.allow_retention_purge = 'true'`.
  - Endpoint de depuración programada `/api/cron/retencion` protegido por `CRON_SECRET` y configurado en `vercel.json` para ejecutarse diariamente.
- **Pruebas y Cobertura**:
  - 16 suites de prueba con 146 tests unitarios e integrados pasando al 100%, incluyendo pruebas de inmutabilidad en base de datos, control de acceso al panel DAL y seguridad del cron.

### Modo Oscuro (Dark Mode) y Experiencia de Usuario (UX)
- Implementación de **Modo Oscuro** nativo con selector accesible (`ThemeToggle`) en cabecera principal, pantalla de login y páginas públicas.
- Script anti-parpadeo (FOUC) síncrono en `<head>` de `RootLayout` y detección automática de preferencia de sistema (`prefers-color-scheme`) con persistencia en `localStorage`.
- Sincronización multi-instancia en caliente con `MutationObserver`.
- Ordenamiento y priorización de búsqueda de inmuebles con jerarquía estricta por `No. Inm` (coincidencia exacta > prefijo numérico > subcadena > otros campos).
- Filas de la tabla de inmuebles (`InmuebleTableRow`) totalmente clickeables con navegación directa al detalle.
- Indicador visual destacado de sección activa en la barra de navegación (`NavLink`) con contraste oscuro, borde sutil y tipografía en negrilla.
- Renombrado de sección y encabezados de "Dashboard" a "Inicio".
- Ajuste del nombre oficial de la plataforma a **Gestión Inmueble Naranjo** y de la razón social a **Inmobiliaria Naranjo LTDA.** en metadatos, cabecera, login, pie de página y páginas legales.
- Inclusión de páginas públicas de **Términos y Condiciones** (`/terminos`) y **Política de Privacidad y Tratamiento de Datos Personales** (`/privacidad`) bajo normatividad colombiana (Ley 1273 de 2009 y Ley 1581 de 2012).

### Seguridad, Firewall y Permisos
- Configuración y activación de **Vercel Edge Firewall** perimetral:
  - Geo-bloqueo exclusivo a Colombia (`CO`).
  - Rate limiting estricto contra ataques de fuerza bruta en `/api/auth` y `/login` (5 peticiones por minuto por IP).
  - Desafío y bloqueo de bots maliciosos automáticos.
- Script de diagnóstico y auditoría del firewall en `scripts/setup-vercel-firewall.sh`.
- Habilitación del permiso de archivado de inmuebles (`INMUEBLES_MANAGE`) para usuarios con rol `ASESOR`. La restauración permanece exclusiva para `ADMIN`.
- Acceso público sin redirección forzada a `/terminos` y `/privacidad` en `auth.ts` y matriz de permisos.

### Rendimiento y Optimización Vercel
- Fijación de región serverless en `iad1` (`vercel.json`) para colocalización física con la base de datos Prisma Postgres.
- Paralelización concurrente de consultas DAL mediante `Promise.all` en dashboard, inmuebles, mantenimiento y soporte.
- Carga progresiva y streaming con React `Suspense` y skeletons para KPIs y actividades recientes.
- Cacheo reactivo de opciones de filtros (`unstable_cache`) con revalidación por tags (`inmuebles-filtros`).

### Entorno de Desarrollo y Semillas
- Carga automática de variables de entorno desde `.env.local` y `.env` en `prisma.config.ts`, `seed-admin.ts`, `seed-asesor.ts` y `seed-inmuebles.ts`.
- Actualización atómica de contraseñas para usuarios existentes al re-ejecutar semillas de desarrollo (`admin123` / `asesor123`).

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
- Cobertura de pruebas unitarias ampliada a 12 suites (126 pruebas pasando).
