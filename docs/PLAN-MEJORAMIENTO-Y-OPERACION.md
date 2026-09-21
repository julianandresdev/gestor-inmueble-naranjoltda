# Plan de mejoramiento, desarrollo y operación

Fecha de creación: 2026-09-18

## Objetivo

Estabilizar el proyecto en desarrollo, retirar de forma controlada la versión
actual de producción, definir una estrategia reproducible de producción yre
establecer un ciclo de CI/CD, versionado y corrección de bugs.

Este plan no autoriza por sí mismo a borrar infraestructura ni datos. La
retirada de producción se ejecutará únicamente después de identificar el
proveedor, respaldar la base de datos y confirmar el procedimiento de retorno.

## Situación actual

- Aplicación Next.js 16 + Prisma 7 + PostgreSQL.
- Existe Docker Compose únicamente para PostgreSQL local.
- No hay Dockerfile de la aplicación ni workflows de GitHub Actions.
- No hay configuración de proveedor de despliegue en el repositorio.
- `pnpm typecheck` pasa y los tests actuales pasan.
- El repositorio tiene cambios locales existentes que deben conservarse:
  `src/app/tareas/actions.ts`, `src/lib/audit.ts`, `src/lib/dal.ts`,
  `tests/tareas-actions.test.ts`, además de documentación de auditoría local.
- El proyecto declara Node 20/22/24, pero el entorno actual usa Node 26; esto
  debe normalizarse antes de usar CI como fuente de verdad.
- El script `build` ejecuta `prisma migrate deploy`; conviene separar la
  compilación de la aplicación de la migración de base de datos.
- La documentación funcional todavía no refleja completamente el rol
  `MANTENIMIENTO`, el módulo de soporte ni el estado real del sistema.
- La aplicación está desplegada en Vercel y usa Neon como PostgreSQL de
  producción.

## Decisión sobre PostgreSQL en Vercel

El producto histórico llamado Vercel Postgres ya no está disponible para crear
nuevas bases. Vercel gestiona actualmente PostgreSQL mediante integraciones del
Marketplace. Neon continúa siendo una de esas integraciones, pero para este
proyecto se evaluará Prisma Postgres como reemplazo, porque el proyecto ya usa
Prisma ORM 7 y `@prisma/adapter-pg`.

La migración no se considerará terminada hasta comprobar que:

- el dump de Neon se puede restaurar localmente;
- el esquema y el número de registros coinciden;
- las relaciones, usuarios, sesiones y actividad se conservan;
- la aplicación funciona contra la copia local;
- Prisma Postgres recibe y conserva todos los datos;
- la aplicación funciona en un Preview de Vercel con la nueva base;
- producción se puede cambiar de vuelta a Neon si la validación falla.

## Fase 0 — Retirar producción de forma segura

Antes de apagar o eliminar cualquier recurso:

1. Identificar proveedor, proyecto, dominio, servicio de aplicación, base de
   datos, almacenamiento y variables de entorno de producción.
2. Registrar cómo se despliega actualmente y quién tiene acceso.
3. Crear un respaldo verificable de PostgreSQL y conservarlo fuera del entorno
   que se va a retirar.
4. Probar que el respaldo puede restaurarse en una base local o temporal.
5. Registrar versiones, migraciones aplicadas, dominio y configuración actual.
6. Poner la aplicación en modo de mantenimiento o detener el tráfico.
7. Apagar primero la aplicación y conservar la base de datos durante el periodo
   acordado de retención.
8. Eliminar recursos solamente después de validar el respaldo y confirmar que
   no existen usuarios que necesiten la información.

Resultado esperado: producción fuera de servicio, datos preservados y una ruta
clara para recuperar la versión anterior si fuese necesario.

### Respaldo local de Neon

El respaldo debe hacerse usando la cadena de conexión directa/no agrupada de
Neon, nunca una credencial expuesta en el repositorio. El procedimiento será:

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL_PROD_DIRECT" \
  --file="backups/gestor-inmueble-neon-YYYY-MM-DD.dump"
```

Después se restaurará en una instancia PostgreSQL local limpia:

```bash
createdb gestor_inmueble_restore
pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname="$DATABASE_URL_LOCAL_RESTORE" \
  "backups/gestor-inmueble-neon-YYYY-MM-DD.dump"
```

La carpeta de backups locales no debe versionarse ni subirse a Git. La
verificación incluirá conteo por tabla, comprobación de migraciones, consultas
representativas y login con un usuario de prueba. Las credenciales reales se
revocarán o rotarán si fueron compartidas durante el proceso.

## Fase 1 — Normalizar development

- Fijar una versión soportada de Node mediante `.nvmrc` o `.node-version` y
  `package.json`.
- Documentar instalación desde cero: Node, pnpm, PostgreSQL, variables de
  entorno, migraciones y datos iniciales.
- Separar claramente `.env.development` de cualquier secreto de producción.
- Mantener PostgreSQL local con Docker Compose.
- Añadir comandos explícitos para:
  - validar formato y lint;
  - revisar tipos;
  - ejecutar tests;
  - generar Prisma Client;
  - aplicar migraciones de desarrollo;
  - levantar una build local de producción.
- Definir datos semilla mínimos y seguros para desarrollo.
- No usar datos reales de producción en development sin anonimización.

## Fase 2 — Pulir el producto y corregir defectos

Orden recomendado:

1. Corregir defectos funcionales y de autorización detectados en la auditoría.
2. Consolidar la matriz de permisos de `ADMIN`, `ASESOR` y `MANTENIMIENTO`.
3. Hacer que las Server Actions validen sus permisos directamente, sin depender
   únicamente del middleware o de la interfaz.
4. Resolver inconsistencias de paginación, fechas y operaciones concurrentes.
5. Añadir pruebas para cada bug corregido y para cada permiso crítico.
6. Revisar experiencia de usuario, estados vacíos, errores y carga.
7. Actualizar `README.md`, `docs/REQUIREMENTS.md` y `docs/STACK.md` para que
   describan el comportamiento real.

Cada corrección debe incluir causa, cambio, prueba de regresión y referencia a
la incidencia o ticket correspondiente.

## Fase 3 — Migrar a Prisma Postgres mediante Vercel Marketplace

1. Crear una base nueva de Prisma Postgres desde el Marketplace de Vercel, sin
   modificar aún la conexión de producción.
2. Obtener sus cadenas pooled y direct; usar la pooled para la aplicación y la
   direct para migraciones, `pg_dump`, `pg_restore` y herramientas
   administrativas.
3. Restaurar el dump validado en la nueva base o ejecutar una migración de
   datos equivalente, verificando enums, secuencias, índices y relaciones.
4. Configurar la nueva base únicamente en un Preview o entorno temporal.
5. Ejecutar smoke tests y pruebas funcionales contra ese Preview.
6. Programar la ventana de cambio, tomar un último backup de Neon y congelar
   escrituras durante la copia final si se requiere consistencia estricta.
7. Cambiar las variables de producción a la nueva base y hacer un redeploy.
8. Verificar login, inmuebles, notas, tareas, mantenimiento, soporte y
   auditoría.
9. Mantener Neon intacto durante el periodo de retención acordado antes de
   eliminarlo.

## Fase 4 — Definir producción reproducible

La producción debe tener como mínimo:

- Aplicación Next.js construida desde una versión etiquetada del repositorio.
- PostgreSQL administrado o alojado con copias de seguridad automáticas.
- Variables de entorno gestionadas fuera del repositorio.
- `AUTH_SECRET` y credenciales diferentes de development.
- HTTPS y dominio definido.
- Logs de aplicación y base de datos accesibles.
- Health check y procedimiento de rollback.
- Migraciones ejecutadas como paso controlado y separado del build.
- Política de backups, retención y restauración probada.

La opción inicial recomendada es un único servicio de aplicación más una base
PostgreSQL administrada, evitando complejidad innecesaria. El proveedor se
decidirá antes de crear la configuración definitiva.

## Fase 5 — CI/CD

### CI en cada pull request

Ejecutar en una versión fija de Node y pnpm:

1. Instalar dependencias con lockfile estricto.
2. Generar Prisma Client.
3. Ejecutar lint.
4. Ejecutar typecheck.
5. Ejecutar tests.
6. Ejecutar build sin modificar una base de datos real.

Los pull requests no deben fusionarse si falla cualquiera de estos pasos.

### CD hacia un entorno de prueba

- Desplegar automáticamente desde `develop` o desde la rama definida para
  integración.
- Aplicar migraciones únicamente contra la base de datos de prueba.
- Ejecutar smoke tests después del despliegue.

### CD hacia producción

- Promover una versión ya validada, preferiblemente mediante tag o release.
- Requerir aprobación manual.
- Crear backup o snapshot antes de migraciones destructivas.
- Ejecutar migraciones antes de iniciar la nueva aplicación cuando corresponda.
- Verificar health check, login, lectura de inmuebles y flujo principal de
  tareas.
- Mantener rollback de aplicación y procedimiento de restauración de base de
  datos documentados.

## Versionado y ramas

- Usar SemVer: `MAJOR.MINOR.PATCH`.
- `PATCH`: correcciones compatibles.
- `MINOR`: funcionalidades compatibles.
- `MAJOR`: cambios incompatibles o migraciones con impacto operativo.
- `main`: código listo para producción.
- `develop`: integración y validación previa, si el equipo mantiene ese flujo.
- Ramas de trabajo: `codex/`, `feature/`, `fix/`, `chore/` según el tipo de
  cambio.
- Cada release debe incluir tag, resumen de cambios, migraciones, riesgos y
  procedimiento de rollback.

## Gestión de bugs

Cada bug debe registrarse con:

- título reproducible;
- entorno afectado;
- pasos para reproducir;
- resultado esperado y resultado actual;
- severidad y prioridad;
- evidencia o logs sin secretos;
- causa raíz;
- prueba de regresión;
- versión en la que se corrigió.

Severidades sugeridas:

- `S1`: pérdida de datos, acceso indebido o indisponibilidad total;
- `S2`: flujo principal bloqueado;
- `S3`: funcionalidad importante con alternativa;
- `S4`: defecto visual o mejora menor.

## Criterio de finalización

El proyecto ha cumplido los criterios para operar en producción:

- [x] El entorno de desarrollo es reproducible (Node 22.12.0 fijado, Docker Compose con Postgres 17-alpine, scripts estandarizados).
- [x] CI está funcionando y automatizado vía GitHub Actions (`.github/workflows/ci.yml`).
- [x] Build local y remota validada (`pnpm build`).
- [x] La matriz de permisos de roles (`ADMIN`, `ASESOR`, `MANTENIMIENTO`) y las Server Actions están protegidas y cubiertas por 125 tests unitarios.
- [x] Las migraciones y el respaldo de datos fueron restaurados y validados (340 inmuebles, 6 usuarios, 12 migraciones históricas).
- [x] Documentación de despliegue, rollback y operación actualizada.
- [x] Despliegue en producción completado en Vercel conectado a Prisma Postgres (`gestor-inmueble-db`).

## Resoluciones a decisiones pendientes

1. **Proveedor PostgreSQL**: Confirmado **Prisma Postgres** (`prisma/prisma-postgres`) mediante el Marketplace de Vercel (región `iad1`), conectado a través de `@prisma/adapter-pg`.
2. **Periodo de retención de Neon**: Se conserva la instancia de Neon intacta durante 30 días como respaldo pasivo antes de su desactivación definitiva.
3. **Estrategia de ramas**: Modelo basado en trunk (`main` protegido con CI obligatorio y ramas `feature/`, `fix/`, `chore/`).
4. **CI/CD**: GitHub Actions para validación automática (`lint`, `typecheck`, `test`, `build`) y Vercel para despliegues de Preview y Producción.
5. **Backups y monitoreo**: Respaldos locales mediante `pg_dump` con formato custom (`.dump`) y logs en Vercel Dashboard / Prisma Data Platform.

