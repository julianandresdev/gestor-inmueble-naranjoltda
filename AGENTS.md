<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Directrices de Desarrollo para Agentes (Gestión Inmobiliaria Naranjo)

Este repositorio contiene la plataforma interna de gestión inmobiliaria de **Inmobiliaria Naranjo LTDA.** (versión actual: `v1.2.1`). Cualquier agente o desarrollador que opere en este proyecto debe acatar estrictamente las siguientes directrices arquitectónicas, de seguridad y de base de datos.

---

## 1. Stack Tecnológico y Reglas del Framework

- **Next.js 16 (App Router con Server Components y Server Actions)**:
  - Todo componente con estado o hooks interactivos del cliente debe iniciar explícitamente con `"use client"`.
  - Los Server Actions deben validar permisos mediante `requireAuth()` o `requirePermission()` desde `@/lib/dal` o `@/lib/permissions`.
  - Nunca llames `headers()` o `cookies()` en contextos síncronos; en Next.js 16 son APIs asíncronas (`await headers()`).
- **Prisma ORM 7 + PostgreSQL con `@prisma/adapter-pg`**:
  - Toda mutación crítica debe ejecutarse dentro de transacciones de base de datos (`prisma.$transaction`).
  - La tabla `actividad` y `registro_accesos` son **estrictamente inmutables**.
- **Tailwind CSS v4 + Base UI (shadcn/ui)**:
  - Se utilizan tokens de color en formato OKLCH definidos en `src/app/globals.css`.
  - Para ocultar barras de desplazamiento nativas manteniendo scroll horizontal/vertical activo, usa la clase `.no-scrollbar`.

---

## 2. Inmutabilidad y Auditoría en 3 Capas

El sistema implementa una política de estricta inmutabilidad (*append-only*) para los registros de auditoría y accesos:

1. **Capa 1 (Aplicación / DAL)**: Ninguna server action expone endpoints de modificación o eliminación de actividades ni accesos.
2. **Capa 2 (ORM / Prisma Client Extension)**: En [`src/lib/prisma.ts`](src/lib/prisma.ts), una extensión intercepta e interrumpe con `InmutableAuditError` cualquier llamada a `update`, `updateMany`, `upsert`, `delete` o `deleteMany` sobre `Actividad` o `RegistroAcceso`, a menos que se ejecute dentro del contexto autorizado de depuración programada (`runWithRetentionPurge`).
3. **Capa 3 (Motor PostgreSQL / Triggers SQL)**: La migración `20260920000000_audit_inmutability_triggers` añade disparadores a nivel de base de datos que lanzan excepciones `SQLSTATE '55000'` si se intenta ejecutar un `UPDATE` o `DELETE` directo contra las tablas `actividad` o `registro_accesos`.

> ⚠️ **Regla para Agentes**: Nunca intentes alterar ni eliminar registros de `actividad` o `registro_accesos` manualmente ni por script, salvo mediante el endpoint oficial de retención `/api/cron/retencion`.

---

## 3. Conexiones a Base de Datos en Vercel (Runtime vs. Migraciones)

Para evitar el error de agotamiento de conexiones `P2037: Too many connections for role "prisma_migration"`:
- **Runtime de la Aplicación ([`src/lib/prisma.ts`](src/lib/prisma.ts))**: Prioriza `process.env.POSTGRES_URL` (conexión a través del Connection Pooler / PgBouncer de Prisma). Limita el pool de Node.js a `max: 4` en producción con timeouts agresivos de inactividad (`idleTimeoutMillis: 15000`).
- **Migraciones y CLI ([`prisma.config.ts`](prisma.config.ts))**: Utiliza `DATABASE_URL` (conexión directa con permisos DDL bajo el rol `prisma_migration`).
- Durante el build en Vercel, `pnpm build` ejecuta `prisma migrate deploy && prisma generate && next build --webpack`.

---

## 4. Presencia en Vivo y Heartbeats

- El cliente ejecuta un componente ligero [`PresenceHeartbeat`](src/components/presence-heartbeat.tsx) que envía un latido HTTP cada 60 segundos a [`src/app/actions-presencia.ts`](src/app/actions-presencia.ts) mientras el usuario está autenticado.
- La presencia se almacena en la tabla `sesiones_presencia` con `upsert`. Si un usuario supera los 3 minutos sin latidos, se considera desconectado en el panel administrativo (`/administracion/panel`).

---

## 5. Control de Acceso y Roles

El sistema implementa tres roles definidos en el enum `Rol`:
- **`ADMIN`**: Acceso completo, panel de métricas y supervisión (`/administracion/panel`), gestión de usuarios, ver y restaurar archivados, control total de tickets y tareas.
- **`ASESOR`**: Inventario inmobiliario (ver, crear, editar, archivar), creación y gestión de tareas asignadas a sí mismo, tickets de soporte propios. No tiene acceso a métricas ni administración de usuarios.
- **`MANTENIMIENTO`**: Vista especializada de órdenes de trabajo y tareas de reparación.

---

## 6. Sistema de Versiones y Flujo de Releases

- La versión actual se define de forma centralizada en [`src/lib/version.ts`](src/lib/version.ts) (`APP_VERSION = "1.2.1"`) y en `package.json`.
- Cada versión debe documentarse en `APP_CHANGELOG` y en [`CHANGELOG.md`](CHANGELOG.md).
- Comandos para publicar versiones:
  - `pnpm release:patch`: Correcciones y parches (`1.2.1` $\rightarrow$ `1.2.2`).
  - `pnpm release:minor`: Nuevas características compatibles (`1.2.1` $\rightarrow$ `1.3.0`).
  - `pnpm release:major`: Cambios estructurales o incompatibles (`1.2.1` $\rightarrow$ `2.0.0`).

---

## 7. Verificación Obligatoria Antes de Confirmar o Publicar

Antes de confirmar cualquier cambio (`git commit`) o proponerlo al usuario:
```bash
pnpm typecheck   # 0 errores de TypeScript
pnpm test        # 100% de suites pasando (146+ tests)
pnpm build       # Compilación exitosa en modo producción
```

