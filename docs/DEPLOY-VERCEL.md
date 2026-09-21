# Despliegue en Vercel

## Configuración

1. Importar el repositorio y seleccionar `pnpm` como gestor (Vercel detecta el
   `packageManager` del `package.json`).
2. Usar Node `22.x` y el comando de build `pnpm build`.
3. Configurar `DATABASE_URL` con la cadena pooled/runtime del proveedor de
   PostgreSQL y `AUTH_SECRET` con un secreto nuevo de producción.
4. Configurar `NEXT_PUBLIC_APP_URL` con la URL HTTPS final. Añadir Telegram
   únicamente si se desean notificaciones.
5. Mantener Preview y Production con bases y secretos separados mientras se
   valida la migración.

Variables de producción mínimas:

```text
DATABASE_URL
AUTH_SECRET
NEXT_PUBLIC_APP_URL
```

Las variables de seed (`ADMIN_*`, `ASESOR_PASSWORD`) no son necesarias para
servir la aplicación y no deben configurarse por costumbre en producción.

## Orden de despliegue

El build no cambia el esquema. Antes de promover una versión que incluye una
migración:

```bash
DATABASE_URL="$DATABASE_URL_PROD_DIRECT" pnpm db:migrate:deploy
pnpm build
```

En Vercel, el primer comando debe ejecutarse desde un entorno administrativo o
un job de despliegue controlado con la cadena directa. No se recomienda ponerlo
en cada build de Preview porque puede apuntar por error a la base equivocada.

Después del deploy verificar login, lectura de inmuebles, creación de nota,
reclamo/completado de tarea, mantenimiento, soporte y actividad. Mantener Neon
intacto durante el periodo de retención acordado antes de eliminarlo.

## Migración desde el dump

Restaurar primero el dump en una base de Preview o temporal, ejecutar las
migraciones pendientes y comparar conteos por tabla. No ejecutar `migrate reset`
ni `db push --force-reset` sobre una base que contenga datos de producción.

## Estado de Producción Actual (2026-09-20)

- **URL de Producción**: `https://gestor-inmueble-naranjoltda.vercel.app`
- **Proyecto Vercel**: `gestor-inmueble-naranjoltda` (Scope: `andreslc07s-projects`)
- **Región Serverless**: `iad1` (configurada vía `vercel.json` para máxima proximidad física a la base de datos).
- **Base de Datos**: Prisma Postgres (`gestor-inmueble-db`) aprovisionada mediante Vercel Marketplace en región `iad1` (PostgreSQL 17.2).
- **Driver**: Prisma ORM 7 con `@prisma/adapter-pg`.
- **Datos**: Restauración completa desde el dump del 2026-09-18 (340 inmuebles, 6 usuarios, 12 migraciones históricas aplicadas y consistentes).
- **Retención de Neon**: Neon permanece en estado pasivo como respaldo secundario durante el periodo de retención de 30 días.

## Seguridad Perimetral: Vercel Edge Firewall (WAF)

El proyecto cuenta con reglas de seguridad en el Edge activadas y publicadas mediante Vercel CLI (`scripts/setup-vercel-firewall.sh`):

1. **Restricción Geográfica (Geo-Blocking)**: Acceso restringido exclusivamente a Colombia (`geo_country = 'CO'`). Peticiones de otros países reciben bloqueo HTTP 403 automático en el Edge.
2. **Protección de Fuerza Bruta (Rate Limiting)**: Máximo 5 peticiones por minuto por dirección IP sobre los endpoints de autenticación (`/api/auth` y `/login`).
3. **Protección contra Bots**: Desafío (Challenge) y bloqueo de bots automatizados no verificados por el sistema de Vercel.


