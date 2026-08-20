# Gestion Inmobiliaria Naranjo

Aplicación web interna para la gestión de inmuebles, seguimiento y tareas de la
inmobiliaria Naranjo Ltda. Reemplaza progresivamente el manejo en Excel por una
plataforma centralizada con trazabilidad de acciones.

Incluye un sistema de **tickets de soporte** con notificaciones automáticas a
**Telegram** para que el equipo reciba avisos en tiempo real cuando se reportan
incidencias o cambia el estado de un ticket.

## Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** (base sobre `@base-ui/react`)
- **Prisma 7** + **PostgreSQL** (Docker) con driver adapter `pg`
- **Auth.js v5** (NextAuth) — credenciales, JWT, roles `ADMIN` / `ASESOR`
- **Zod** + **React Hook Form** para validación cliente/servidor
- **Vitest** para pruebas unitarias
- **Telegram Bot API** para notificaciones de tickets de soporte

## Estructura

```
.
├── docker-compose.yml          # PostgreSQL listo para usar
├── docs/                       # Documentación funcional y técnica
│   ├── REQUIREMENTS.md
│   └── STACK.md
├── prisma/
│   ├── schema.prisma           # Modelos, enums, migraciones aplicadas
│   └── migrations/             # Migraciones de Prisma
├── scripts/
│   ├── seed-admin.ts           # Crea el administrador inicial
│   ├── seed-inmuebles.ts       # Carga datos de ejemplo en inmuebles
│   └── import-inmuebles-xlsx.ts # Importa el listado Excel a la BD
├── tests/                      # Pruebas unitarias (Vitest)
├── src/
│   ├── app/                    # Rutas, layouts, server actions, server components
│   │   ├── actions.ts          # Acción de login
│   │   ├── login/              # Página pública de login
│   │   ├── dashboard/          # Resumen, métricas, actividad
│   │   ├── inmuebles/          # CRUD inmuebles, archivado, notas
│   │   ├── tareas/             # CRUD tareas, reclamo, liberación
│   │   ├── soporte/            # Tickets de soporte + conversación
│   │   ├── administracion/     # Usuarios (admin) y archivados
│   │   ├── layout.tsx          # Layout raíz, nav, footer, toaster
│   │   ├── page.tsx            # Página inicial (redirect a /login o /dashboard)
│   │   └── globals.css         # Tema y Figtree
│   ├── components/             # Componentes UI
│   │   ├── ui/                 # shadcn (button, card, dialog, table, …)
│   │   ├── app-nav.tsx         # Navegación principal
│   │   ├── login-form.tsx
│   │   ├── logout-form.tsx
│   │   ├── actividad-timeline.tsx
│   │   ├── spinner.tsx         # Spinner estándar
│   │   ├── skeleton.tsx        # Skeleton base
│   │   └── skeletons.tsx       # Skeletons específicos (tabla, card, KPI)
│   ├── lib/                    # Lógica de servidor
│   │   ├── prisma.ts           # Singleton de Prisma con driver pg
│   │   ├── dal.ts              # requireAuth, requireAdmin, queries
│   │   ├── audit.ts            # Registro de actividad en transacciones
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

## Arrancar PostgreSQL con Docker

```bash
docker compose up -d
```

Levanta PostgreSQL en `localhost:5432` con base `gestor_inmueble` y
credenciales `postgres`/`postgres`. Persistencia en volumen `gestor_pgdata`.

## Instalación

```bash
pnpm install
cp .env.example .env
# Editar .env si la base no es la de Docker.
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | URL de conexión PostgreSQL. |
| `AUTH_SECRET` | Secreto JWT de Auth.js. Genera uno con `openssl rand -base64 32`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Credenciales del admin inicial (se usan solo en el seed). |
| `NODE_ENV` | `development` \| `production`. |
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
pnpm prisma:migrate     # Aplica migraciones pendientes (también prisma generate)
pnpm prisma:studio      # UI para inspeccionar la base
```

## Crear el administrador inicial

```bash
pnpm seed:admin
```

Lee `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_NOMBRE` del `.env` y crea la fila
correspondiente en `usuarios` con la contraseña hashed con `bcrypt`.

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
pnpm build       # genera .next/ a partir de .env (aplica NEXT_PUBLIC_*, etc.)
pnpm start       # sirve la build de producción
```

Útil para validar el comportamiento en un entorno idéntico al de despliegue
(bundle optimizado, sin fast refresh, con `x-powered-by` de Next).

Para exponerlo en otra IP de tu LAN (p. ej. `http://192.168.1.10:3000`),
añade `allowedDevOrigins` en `next.config.ts`

### Resumen de scripts

| Script | Uso |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con hot-reload. |
| `pnpm build` | Compila la aplicación para producción. |
| `pnpm start` | Sirve la build de producción. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | TypeScript en modo estricto. |
| `pnpm test` / `pnpm test:watch` | Pruebas unitarias (Vitest). |
| `pnpm prisma:generate` | Regenera el cliente de Prisma. |
| `pnpm prisma:migrate` | Aplica migraciones pendientes. |
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
