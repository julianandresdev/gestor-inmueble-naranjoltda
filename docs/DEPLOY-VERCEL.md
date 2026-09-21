# Despliegue en Vercel

## Configuración del Proyecto

1. Importar el repositorio y seleccionar `pnpm` como gestor de paquetes.
2. Runtime recomendado: Node `22.x`.
3. El comando de build en `package.json` ejecuta automáticamente:
   ```bash
   prisma migrate deploy && prisma generate && next build --webpack
   ```
   Esto garantiza que cualquier migración pendiente de base de datos se aplique antes de que la nueva versión del código empiece a atender peticiones.

### Variables de Entorno en Vercel

| Variable | Rol / Función | Ámbito |
| :--- | :--- | :--- |
| `POSTGRES_URL` | Cadena de conexión mediante **Connection Pooler** (`pooled.db.prisma.io:5432`). Consumida en runtime por Server Components y Server Actions para soportar tráfico concurrente sin agotar conexiones. | Production / Preview |
| `DATABASE_URL` | Cadena de conexión **directa** (`db.prisma.io:5432`) bajo el rol `prisma_migration`. Consumida por el CLI de Prisma (`prisma.config.ts`) durante el build para operaciones DDL. | Production / Preview |
| `AUTH_SECRET` | Secreto de firmado JWT para Auth.js (mínimo 32 caracteres generados con `openssl rand -base64 32`). | Production / Preview |
| `CRON_SECRET` | Token Bearer para autorizar las peticiones del Cron Job de retención hacia `/api/cron/retencion`. | Production |
| `NEXT_PUBLIC_APP_URL` | URL canónica HTTPS (ej. `https://gestor-inmueble-naranjoltda.vercel.app`). | Production / Preview |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | (Opcional) Notificaciones inmediatas de tickets de soporte técnico. | Production |

> 💡 **Nota sobre Secrets**: Prisma Postgres en Vercel provisiona automáticamente `POSTGRES_URL` y `DATABASE_URL`. El código fuente ([`src/lib/prisma.ts`](../src/lib/prisma.ts) y [`prisma.config.ts`](../prisma.config.ts)) detecta y prioriza cada variable según su propósito (pooled para la app, directa para migraciones) sin requerir reconfiguración manual.

---

## Tareas Programadas (Vercel Cron)

El proyecto incluye un endpoint de retención y mantenimiento periódico en [`/api/cron/retencion`](../src/app/api/cron/retencion/route.ts) configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/retencion",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- **Frecuencia**: Diario a las 03:00 UTC.
- **Acciones ejecutadas**:
  1. Depuración de registros de auditoría y accesos que superen el periodo reglamentario (12 meses por defecto).
  2. Eliminación de sesiones de presencia inactivas con más de 24 horas.
- **Seguridad**: Valida el encabezado `Authorization: Bearer <CRON_SECRET>`.

---

## Estado de Producción Actual (Versión `v1.2.1`)

- **URL de Producción**: `https://gestor-inmueble-naranjoltda.vercel.app`
- **Proyecto Vercel**: `gestor-inmueble-naranjoltda` (Scope: `andreslc07s-projects`)
- **Región Serverless**: `iad1` (Washington, D.C.) en máxima proximidad física a la base de datos.
- **Base de Datos**: Prisma Postgres (`gestor-inmueble-db`) aprovisionada en región `iad1` (PostgreSQL 17.2).
- **Estrategia de Conexión**: Híbrida (`POSTGRES_URL` para runtime con pool local `max: 4` e idle timeout de 15s; `DATABASE_URL` para DDL de migraciones).
- **Seguridad Perimetral (Edge Firewall)**:
  1. **Georrestricción**: Acceso restringido exclusivamente a Colombia (`geo_country = 'CO'`). Peticiones foráneas bloqueadas en el Edge con HTTP 403.
  2. **Rate Limiting**: Límite de 5 peticiones por minuto por IP en `/api/auth` y `/login`.
  3. **Protección contra Bots**: Challenge automático contra tráfico no legítimo.



