# Gestion Inmueble Naranjo · `v1.2.1`

Aplicación web interna para la gestión integral de inmuebles, seguimiento operativo,
supervisión y tareas de **Inmobiliaria Naranjo LTDA.** Reemplaza el manejo en hojas
de cálculo por una plataforma centralizada con auditoría inmutable, presencia en vivo,
control de acceso por roles y métricas en tiempo real.

Incluye un sistema de **tickets de soporte** con notificaciones automáticas a
**Telegram** para que el equipo reciba avisos en tiempo real cuando se reportan
incidencias o cambia el estado de un ticket.

## Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** (base sobre `@base-ui/react`) + **Modo Oscuro** nativo
- **Prisma 7** + **PostgreSQL** con driver adapter `@prisma/adapter-pg` y pooler serverless
- **Auth.js v5** (NextAuth) — credenciales, JWT, roles `ADMIN` / `ASESOR` / `MANTENIMIENTO`
- **Auditoría Inmutable en 3 Capas** — Protección aplicativa, extensión Prisma y triggers SQL
- **Presencia en Tiempo Real** — Latido periódico de 60 segundos por sesión activa
- **Zod** + **React Hook Form** para validación cliente/servidor
- **Vitest** para pruebas unitarias (146 tests automatizados)
- **Telegram Bot API** para notificaciones de tickets de soporte

## Estructura

```
.
├── docker-compose.yml          # PostgreSQL listo para usar
├── Dockerfile                  # Imagen standalone de producción
├── .github/workflows/ci.yml    # CI para PR y main
├── CHANGELOG.md                # Historial formal de versiones (Keep a Changelog)
├── docs/                       # Documentación funcional y técnica
│   ├── REQUIREMENTS.md
│   ├── STACK.md
│   ├── OPERACION-Y-RELEASES.md
│   └── DEPLOY-VERCEL.md
├── prisma/
│   ├── schema.prisma           # Modelos, enums, migraciones aplicadas
│   └── migrations/             # Migraciones versionadas de Prisma
├── scripts/
│   ├── seed-admin.ts           # Crea el administrador inicial
│   ├── seed-asesor.ts          # Crea el asesor de desarrollo
│   ├── seed-inmuebles.ts       # Carga datos de ejemplo en inmuebles
│   └── import-inmuebles-xlsx.ts # Importa el listado Excel a la BD
├── tests/                      # Pruebas unitarias y de inmutabilidad (Vitest)
├── src/
│   ├── app/                    # Rutas, layouts, server actions, server components
│   │   ├── actions.ts          # Acción de login
│   │   ├── actions-presencia.ts# Heartbeat periódico de presencia
│   │   ├── login/              # Página pública de login
│   │   ├── dashboard/          # Resumen operativo inicial (Inicio)
│   │   ├── inmuebles/          # CRUD inmuebles, archivado, notas
│   │   ├── tareas/             # CRUD tareas, reclamo, liberación
│   │   ├── mantenimiento/      # Solicitudes y órdenes de mantenimiento
│   │   ├── soporte/            # Tickets de soporte + conversación
│   │   ├── administracion/     # Panel de métricas (/panel), usuarios y archivados
│   │   ├── api/cron/retencion/ # Endpoint de purga y retención periódica
│   │   ├── terminos/           # Términos y condiciones (público, Ley 1581)
│   │   ├── privacidad/         # Política de privacidad (público, Habeas Data)
│   │   ├── layout.tsx          # Layout raíz, nav, footer con VersionBadge
│   │   ├── page.tsx            # Página inicial (redirect a /login o /dashboard)
│   │   └── globals.css         # Tema, tokens OKLCH, modo oscuro y .no-scrollbar
│   ├── components/             # Componentes UI
│   │   ├── ui/                 # shadcn (button, card, dialog, table, …)
│   │   ├── app-nav.tsx         # Cabecera con scroll horizontal fluido y nombres truncados
│   │   ├── nav-link.tsx        # Enlace con indicador de sección activa (shrink-0)
│   │   ├── theme-toggle.tsx    # Conmutador de modo claro/oscuro
│   │   ├── version-badge.tsx   # Badge interactivo con modal de novedades y changelog
│   │   ├── presence-heartbeat.tsx # Emisor de latido en segundo plano
│   │   ├── login-form.tsx
│   │   ├── logout-form.tsx
│   │   ├── actividad-timeline.tsx
│   │   ├── spinner.tsx         # Spinner estándar
│   │   ├── skeleton.tsx        # Skeleton base
│   │   └── skeletons.tsx       # Skeletons específicos (tabla, card, KPI)
│   ├── lib/                    # Lógica de servidor
│   │   ├── prisma.ts           # Singleton Prisma con pooler POSTGRES_URL e inmutabilidad
│   │   ├── version.ts          # Fuente única de verdad de la versión y changelog
│   │   ├── dal.ts              # requireAuth, requireAdmin, queries base
│   │   ├── dal-admin-panel.ts  # Métricas, KPIs y agregaciones de supervisión
│   │   ├── audit.ts            # Registro y hashing de cambios en transacciones
│   │   ├── permissions.ts      # Matriz de permisos RBAC
│   │   ├── client-info.ts      # Detección de IP y User-Agent
│   │   ├── tarea-utils.ts      # Helpers de tareas (esVencida, etiquetas)
│   │   ├── soporte-utils.ts    # Labels y variantes de badge de tickets
│   │   ├── telegram.ts         # Cliente server-only para Telegram Bot API
│   │   └── utils.ts            # cn() de shadcn
│   ├── auth.ts                 # Configuración de Auth.js
│   ├── proxy.ts                # Proxy (Next 16) que aplica la lógica de Auth.js
│   └── types/
│       └── next-auth.d.ts      # Augmentación de tipos de sesión/JWT
├── .env.example
├── vitest.config.ts
├── next.config.ts
└── tsconfig.json
```

## Requisitos previos

- Node.js 20.19+, 22.12+ o 24.x y pnpm 10+
- PostgreSQL (local o vía Docker)
- Credenciales de la base de datos
- (Opcional, para notificaciones de soporte) un bot de Telegram y el `chat_id`
  destino

La versión recomendada es Node 22.12.0 (también declarada en `.nvmrc`) y pnpm
10.15.0. Se debe usar la misma versión en local y CI.

## Arrancar PostgreSQL con Docker

```bash
docker compose up -d
```

Levanta PostgreSQL en `127.0.0.1:5432` (solo loopback) con base
`gestor_inmueble`. El usuario y la contraseña se leen desde `POSTGRES_USER`
y `POSTGRES_PASSWORD` del `.env` — defínelos antes de levantar el stack
(`docker-compose.yml` no los trae fijados). Persistencia en volumen
`gestor_pgdata`.

> ⚠️ Este compose es **solo para desarrollo**. Antes de desplegar en
> producción elimina el bloque `ports` del servicio `postgres` para no
> publicar la base de datos al exterior.

## Instalación

```bash
pnpm install
cp .env.example .env
# Editar .env si la base no es la de Docker.
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | URL de conexión directa a PostgreSQL (utilizada para migraciones DDL de Prisma y desarrollo local). |
| `POSTGRES_URL` | URL de conexión mediante pooler PgBouncer de Prisma (priorizada en producción serverless para evitar saturación de conexiones). |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales y nombre de la base consumidos por `docker-compose.yml`. La `DATABASE_URL` local debe usar los mismos valores. |
| `AUTH_SECRET` | Secreto JWT de Auth.js. Genera uno con `openssl rand -base64 32`. |
| `CRON_SECRET` | Token secreto Bearer para autorizar la ejecución programada de `/api/cron/retencion` desde Vercel Cron. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Credenciales del admin inicial (se usan solo en el seed). |
| `ASESOR_PASSWORD` | Contraseña del usuario asesor de desarrollo (se usa solo en el seed). `pnpm seed:asesor` falla si no está definida. |
| `NODE_ENV` | `development` \| `production`. |
| `NEXT_PUBLIC_APP_URL` | URL pública usada para enlaces internos; obligatoria en producción. |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram que envía las notificaciones (obtenido con `@BotFather`). Si se omite, los envíos se omiten silenciosamente. |
| `TELEGRAM_CHAT_ID` | `chat_id` o ID de grupo al que se enviarán los avisos de tickets de soporte. |

### Configurar el bot de Telegram (opcional)

1. Hablar con [@BotFather](https://t.me/BotFather) y crear un bot nuevo con
   `/newbot`. Copiar el token a `TELEGRAM_BOT_TOKEN`.
2. Añadir el bot al grupo o chat destino y obtener el `chat_id`
   (por ejemplo, escribiéndole al bot y consultando
   `https://api.telegram.org/bot<TOKEN>/getUpdates`).
3. Si no se configura, el sistema sigue funcionando: la falta de credenciales
   se loguea como warning y los envíos se omiten sin afectar la operación.

## Migraciones

```bash
pnpm prisma:migrate     # Crea/aplica migraciones durante el desarrollo
pnpm db:migrate:deploy  # Aplica migraciones versionadas en un entorno objetivo
pnpm prisma:studio      # UI para inspeccionar la base
```

## Crear el administrador inicial

```bash
pnpm seed:admin
```

Lee `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_NOMBRE` del `.env` y crea la fila
correspondiente en `usuarios` con la contraseña hashed con `bcrypt`.

## Crear el usuario asesor de desarrollo

```bash
pnpm seed:asesor
```

Lee `ASESOR_PASSWORD` del `.env` y crea el usuario `asesor` con rol `ASESOR`.
El script falla con un error explícito si la variable no está definida.

## Ejecutar la aplicación

### Modo desarrollo

Arrancar hot-reload en `http://localhost:3000`:

```bash
pnpm dev
```

Login con las credenciales de `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Útil para iterar sobre UI o lógica de componentes. No optimiza el bundle.

### Modo producción

Genera un build optimizado y lo sirve en el puerto `3000`:

```bash
pnpm build       # compila la aplicación y ejecuta migraciones pendientes
pnpm db:migrate:deploy # aplica migraciones pendientes de forma explícita
pnpm start       # sirve la build de producción
```

Útil para validar el comportamiento en un entorno idéntico al de despliegue
(bundle optimizado y sin fast refresh).

Para exponerlo en otra IP de tu LAN (p. ej. `http://192.168.1.10:3000`),
añade `allowedDevOrigins` en `next.config.ts`

### Resumen de scripts

| Script | Uso |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con hot-reload. |
| `pnpm build` | Ejecuta migraciones, genera cliente Prisma y compila Next.js. |
| `pnpm build:production` | Aplica migraciones y compila para producción. |
| `pnpm start` | Sirve la build de producción. |
| `pnpm release:patch` | Incrementa versión PATCH en `package.json`, crea commit, tag git y hace push. |
| `pnpm release:minor` | Incrementa versión MINOR en `package.json`, crea commit, tag git y hace push. |
| `pnpm release:major` | Incrementa versión MAJOR en `package.json`, crea commit, tag git y hace push. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | TypeScript en modo estricto. |
| `pnpm test` / `pnpm test:watch` | Pruebas unitarias y de inmutabilidad (Vitest). |
| `pnpm prisma:generate` | Regenera el cliente de Prisma. |
| `pnpm prisma:validate` | Valida el schema Prisma. |
| `pnpm prisma:migrate` | Crea y aplica migraciones durante el desarrollo. |
| `pnpm db:migrate:deploy` | Aplica migraciones versionadas en CI/producción. |
| `pnpm env:check` | Verifica variables mínimas sin imprimir secretos. |
| `pnpm prisma:studio` | Inspeccionar la base. |
| `pnpm seed:admin` | Crea el usuario admin inicial. |
| `pnpm seed:asesor` | Crea el usuario asesor de desarrollo. |
| `pnpm seed:inmuebles` | Carga inmuebles de prueba. |

## Pruebas

```bash
pnpm test           # Una sola pasada
pnpm test:watch     # Modo watch
```

Los tests cubren permisos y acciones críticas (tareas, inmuebles, notas,
usuarios, tickets de soporte) usando mocks de Prisma, Auth.js y Telegram.

## Verificación de calidad

```bash
pnpm typecheck  # TypeScript estricto
pnpm lint       # ESLint
pnpm build      # Build de producción
```

## Roles y permisos

- **ADMIN**: gestiona usuarios, archiva/restaura inmuebles, interviene en
  cualquier tarea, ve todos los tickets de soporte y puede cambiar su estado o
  cerrarlos.
- **ASESOR**: ve y edita todos los inmuebles activos, ve y crea tareas y notas,
  reclama/libera/completa solo sus propias tareas, ve solo los tickets de
  soporte que él creó y puede cambiar su prioridad o comentar sobre ellos.

Ver [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) y [docs/STACK.md](docs/STACK.md)
para el detalle funcional y técnico.

Para el flujo completo de operación, releases, backups y despliegue en Vercel,
ver [docs/OPERACION-Y-RELEASES.md](docs/OPERACION-Y-RELEASES.md) y
[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md).

## Tickets de soporte y notificaciones a Telegram

El módulo `/soporte` permite a cualquier usuario autenticado abrir tickets
(reportar problemas, solicitudes, etc.). Cada ticket tiene prioridad
(`BAJA` / `NORMAL` / `ALTA` / `URGENTE`), estado
(`ABIERTO` → `EN_PROGRESO` → `RESUELTO` → `CERRADO`, o `CANCELADO`) y una
conversación asociada.

### Visibilidad

- Cada usuario ve **solo los tickets que él creó**.
- `ADMIN` ve todos los tickets y puede modificarlos (cambiar estado, cerrar,
  cambiar prioridad).
- `ASESOR` solo puede actuar sobre sus propios tickets.

### Eventos que disparan notificaciones a Telegram

Tras el commit de cada server action, se envía un mensaje formateado al chat
configurado en `TELEGRAM_CHAT_ID`:

| Acción | Evento en Telegram |
| --- | --- |
| Crear ticket | `📩 Soporte · creado` |
| Cambiar estado a `EN_PROGRESO` | `⏳ Soporte · en_progreso` |
| Resolver (`RESUELTO`) | `✅ Soporte · resuelto` |
| Cerrar (`CERRADO`) | `🔒 Soporte · cerrado` |
| Cancelar (`CANCELADO`) | `❌ Soporte · cancelado` |
| Agregar mensaje | `💬 Soporte · comentado` |
| Cambiar prioridad | `📩 Soporte · creado` (re-aprovecha el formato) |

Cada mensaje incluye: autor, estado, prioridad, detalle del cambio y enlace
directo al ticket en la app (`NEXT_PUBLIC_APP_URL` o, en su defecto,
`AUTH_URL` o `http://localhost:3000`).

Si las variables `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` faltan o Telegram
devuelve un error, **la operación principal no se aborta**: se loguea como
`console.error` y se continúa. Esto permite desarrollar y probar la app sin
un bot configurado.

### Implementación

- Cliente: `src/lib/telegram.ts` (`server-only`). Usa `fetch` con
  `AbortController` (timeout 5 s) y `parse_mode: "HTML"`.
- Acciones: `src/app/soporte/actions.ts`. Las cuatro acciones
  (`crearSoporteTicket`, `cambiarEstadoSoporteTicket`,
  `cambiarPrioridadSoporteTicket`, `agregarMensajeSoporte`) validan con Zod,
  ejecutan dentro de `withTransaction` y registran en `actividad`.

## Decisiones de diseño

- **Soft delete**: los inmuebles archivados no se eliminan. Sus tareas y notas
  existentes se conservan.
- **Concurrencia al reclamar tareas**: uso de `updateMany` con condición
  `estado: "SIN_ASIGNAR"` en la misma query para garantizar atomicidad.
- **Auditoría**: tabla `actividad` con `create` dentro de la transacción de
  cada operación para garantizar consistencia. Las acciones de tickets
  registran su propio enum (`SOPORTE_CREADO`, `SOPORTE_EN_PROGRESO`,
  `SOPORTE_RESUELTO`, `SOPORTE_CERRADO`, `SOPORTE_CANCELADO`,
  `SOPORTE_COMENTADO`, `SOPORTE_PRIORIDAD`).
- **Validación**: Zod en cliente y servidor. Las acciones de servidor revalidan
  con `requireAuth` / `requireAdmin` desde `src/lib/dal.ts`.
- **Tickets sin responsable**: el modelo `SoporteTicket` no tiene un campo
  "asignado a". Cualquier ADMIN puede tomar y resolver un ticket, pero el
  cliente (ASESOR) no ve quién lo está atendiendo — la resolución queda en
  manos del equipo y se refleja solo en el timeline de actividad interna.
- **Notificaciones no bloqueantes**: el envío a Telegram se hace en línea
  (`await`) tras el commit de Prisma, con un catch que loguea y continúa. No
  hay colas ni reintentos: si Telegram falla, el aviso se pierde, pero la
  operación principal siempre completa.

## Panel de Administración y Supervisión (`/administracion/panel`)

Acceso exclusivo para el rol `ADMIN`. Centraliza:
- **KPIs Operativos y de Cartera**: Total de inmuebles activos, distribución por destinación (Vivienda/Comercio), tareas pendientes y vencidas, mantenimientos abiertos y tickets de soporte sin resolver.
- **Actividad del Equipo**: Métricas agregadas por usuario, ranking de participación y distribución de actividad por módulo operativo.
- **Sesiones y Presencia en Vivo**: Identificación de usuarios conectados actualmente, última ruta navegada y tiempo transcurrido desde el último latido.
- **Alertas de Salud**: Detección de intentos fallidos sospechosos de login, tareas vencidas y mantenimientos estancados.
- **Filtros Temporales**: Consultas consolidadas por `Hoy`, `Últimos 7 días` o `Últimos 30 días`.

## Presencia en Tiempo Real

- Componente cliente [`PresenceHeartbeat`](src/components/presence-heartbeat.tsx) que envía un pulso HTTP periódico cada 60 segundos mientras el usuario permanece autenticado.
- Registro en base de datos en la tabla `sesiones_presencia` con IP y User-Agent capturados.
- Si una sesión no emite pulsos durante más de 3 minutos, se considera desconectada.
- Las sesiones inactivas por más de 24 horas se depuran automáticamente mediante cron.

## Auditoría Inmutable en Tres Capas

La integridad de las tablas `actividad` y `registro_accesos` está protegida mediante un esquema de inmutabilidad estricta (*append-only*):
1. **Capa Aplicativa**: El DAL no provee funciones ni server actions para modificar o borrar eventos históricos.
2. **Capa ORM Prisma**: Extensión en [`src/lib/prisma.ts`](src/lib/prisma.ts) que bloquea `update`, `updateMany`, `upsert`, `delete` y `deleteMany` lanzando `InmutableAuditError`.
3. **Capa Motor SQL (PostgreSQL Triggers)**: Disparadores en base de datos (`trg_inmutable_actividad` y `trg_inmutable_registro_accesos`) que cancelan cualquier sentencia `UPDATE` o `DELETE` directa con error `SQLSTATE '55000'`.
- **Depuración Autorizada**: El endpoint seguro `/api/cron/retencion` ejecuta la purga de registros que excedan la política de retención reglamentaria (12 meses por defecto) bajo el contexto seguro `runWithRetentionPurge`.

## Sistema de Versiones y Novedades

- Adhesión estricta a **SemVer** (`MAJOR.MINOR.PATCH`).
- Fuente de verdad unificada en [`src/lib/version.ts`](src/lib/version.ts) y [`package.json`](package.json).
- Documentación formal de releases en [`CHANGELOG.md`](CHANGELOG.md) bajo el formato *Keep a Changelog*.
- Componente interactivo [`VersionBadge`](src/components/version-badge.tsx) en el pie de página global, con modal accesible de historial de versiones y novedades para los colaboradores.
- Automatización de publicaciones mediante scripts `pnpm release:patch`, `pnpm release:minor` y `pnpm release:major`.

## Políticas Legales y Cumplimiento Normativo

- **Términos y Condiciones (`/terminos`)**: Regula el uso interno del aplicativo, la confidencialidad de datos comerciales, el secreto profesional y el marco legal colombiano (Ley 1273 de 2009 de Delitos Informáticos).
- **Política de Privacidad (`/privacidad`)**: Cumplimiento de la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales (Habeas Data), garantías de enmascaramiento de información reservada y derechos de los titulares.

