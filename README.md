# Gestion Inmobiliaria Naranjo

Aplicación web interna para la gestión de inmuebles, seguimiento y tareas de la
inmobiliaria Naranjo Ltda. Reemplaza progresivamente el manejo en Excel por una
plataforma centralizada con trazabilidad de acciones.

## Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** (base sobre `@base-ui/react`)
- **Prisma 7** + **PostgreSQL** (Docker) con driver adapter `pg`
- **Auth.js v5** (NextAuth) — credenciales, JWT, roles `ADMIN` / `ASESOR`
- **Zod** + **React Hook Form** para validación cliente/servidor
- **Vitest** para pruebas unitarias

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
pnpm test:watch # Modo watch
```

Los tests cubren permisos y acciones críticas (tareas, inmuebles, notas,
usuarios) usando mocks de Prisma y Auth.js.

## Verificación de calidad

```bash
pnpm typecheck  # TypeScript estricto
pnpm lint       # ESLint
pnpm build      # Build de producción
```

## Roles y permisos

- **ADMIN**: gestiona usuarios, archiva/restaura inmuebles, interviene en
  cualquier tarea.
- **ASESOR**: ve y edita todos los inmuebles activos, ve y crea tareas y notas,
  reclama/libera/completa solo sus propias tareas.

Ver [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) y [docs/STACK.md](docs/STACK.md)
para el detalle funcional y técnico.

## Decisiones de diseño

- **Soft delete**: los inmuebles archivados no se eliminan. Sus tareas y notas
  existentes se conservan.
- **Concurrencia al reclamar tareas**: uso de `updateMany` con condición
  `estado: "SIN_ASIGNAR"` en la misma query para garantizar atomicidad.
- **Auditoría**: tabla `actividad` con `create` dentro de la transacción de
  cada operación para garantizar consistencia.
- **Validación**: Zod en cliente y servidor. Las acciones de servidor revalidan
  con `requireAuth` / `requireAdmin` desde `src/lib/dal.ts`.
