# Auditoría técnica — gestor-inmueble-naranjoltda

Fecha: 2026-09-11. Método: solo lectura (sin modificar código). Fuentes verificadas en el repo.

## 1. Estructura general

Monolito Next.js (App Router, `v16.3.1`) + Server Actions. No hay `pages/` ni API REST propia: la única ruta `/api` es el handler de Auth.js.

```text
src/
  app/                    # rutas + server actions por módulo funcional
    page.tsx              # raíz: redirige por sesión/rol
    layout.tsx            # AppNav + footer + Toaster
    dashboard/            # resumen general
    inmuebles/            # CRUD + [id] (notas, editar) + nuevo
    tareas/               # generales: page, [id], nueva, actions.ts
    mantenimiento/        # tareas tipo MANTENIMIENTO: page, [id], nueva
    soporte/              # tickets: page, [id], nuevo
    administracion/       # solo ADMIN: usuarios/, archivados/
    perfil/               # cuenta propia
    login/
    api/auth/[...nextauth]/  # único API route (Auth.js)
  components/             # transversales: app-nav, login-form, actividad-timeline, ui/
  lib/                    # dal.ts, audit.ts, prisma.ts, rate-limit.ts, telegram.ts, ...
  auth.ts                 # config NextAuth + callback `authorized`
  proxy.ts                # middleware (matcher excluye /api)
  types/next-auth.d.ts
prisma/ schema.prisma + migrations (12 migraciones, ver §4)
tests/ 11 archivos *.test.ts · scripts/ seeds + import-xlsx · docs/
```

Organización: **híbrida**. `src/app/*` es vertical por dominio (inmuebles/tareas/mantenimiento/soporte/administración), cada módulo con su `page.tsx` + `actions.ts` + componentes locales (`*-form.tsx`, `tarea-acciones.tsx`). Lo transversal es horizontal por tipo: `src/components/ui/*`, `src/lib/*`. El síntoma de la hibridación es `src/lib/dal.ts` (1.195 líneas): concentra accesos de todos los dominios en un solo archivo.

## 2. Roles y permisos

### 2.1 Definición del rol

`prisma/schema.prisma:115-119`:

```prisma
enum Rol {
  ADMIN
  ASESOR
  MANTENIMIENTO
}
```

`Usuario.rol` default `ASESOR` (`schema.prisma:15`). El rol viaja en el JWT y la sesión:

- `src/auth.ts:22` — `session: { strategy: "jwt" }`.
- `src/auth.ts:118-143` — callback `jwt`: al login guarda `token.id/role/sessionVersion`; en llamadas siguientes revalida `sessionVersion` contra BD y devuelve `null` (invalida) si cambió.
- `src/auth.ts:144-155` — callback `session`: expone `session.user.{id, role, username}`.
- Tipos en `src/types/next-auth.d.ts:4-27`.

### 2.2 Dónde se valida (tres capas, con inconsistencias)

1. **Middleware/páginas** — `src/auth.ts:156-199` (callback `authorized`, aplicado vía `src/proxy.ts`). Reglas: no logueado → `/login`; `MANTENIMIENTO` solo `/mantenimiento*` y `/perfil`; `/administracion*` solo `ADMIN`; `/mantenimiento*` exige `ADMIN` o `ASESOR`… salvo que el bloque previo ya dejó pasar a `MANTENIMIENTO` (el orden importa: el `if (role === "MANTENIMIENTO")` va primero).
2. **Server actions / DAL** — `src/lib/dal.ts:72-108`: `requireAuth`, `requireAdmin`, `requireAdminOrAsesor`, `requireMantenimiento`. Cada action los invoca al inicio.
3. **Frontend** — `src/components/app-nav.tsx:10-68`: oculta links por rol (p. ej. `!isMantenimiento` para Dashboard/Inmuebles/Tareas/Soporte; `isAdmin` para administración). Los pages repiten checks manuales (p. ej. `src/app/mantenimiento/nueva/page.tsx` exige `ADMIN`/`ASESOR`).

Inconsistencias detectadas:

- `requireMantenimiento` (`dal.ts:98-108`) **está definido pero nunca se usa** (grep en `src` no devuelve ningún uso). Las páginas de mantenimiento usan `getCurrentUser()` + checks manuales.
- `getMantenimientoTarea` (`dal.ts:670-673`) y `getMantenimientoResumen` (`dal.ts:740-745`) llaman `await getCurrentUser()` **sin exigir redirect ni lanzar si es `null`**; la consulta a BD se ejecuta igual. La protección real queda en el middleware de página. Contrasta con `listMantenimientoTareas` (`dal.ts:583-584`), que sí hace `if (!session) redirect("/login")`.
- `listarActividadInmueble` / `listarActividadTarea` (`src/lib/audit.ts:13-57`) **no tienen ningún chequeo de sesión**; dependen de que el caller filtre (la página de detalle de mantenimiento solo pide actividad si `isAdminOrAsesor`).

### 2.3 Rutas de "mantenimiento" y protección backend real

| Superficie | Guardia backend | Veredicto |
|---|---|---|
| `GET /mantenimiento` (`app/mantenimiento/page.tsx:50-51`) | solo sesión (`getCurrentUser` + redirect); rol lo impone el middleware | Protegida contra no-logueados; a rol vía middleware, no en la página |
| `GET /mantenimiento/nueva` (`nueva/page.tsx`) | `requireAuth()` + check manual `ADMIN`/`ASESOR` | **Protegida** (doble: página + middleware) |
| `GET /mantenimiento/[id]` (`[id]/page.tsx:35-40`) | solo sesión; sin check de rol en la página | Depende del middleware; al ser solo 3 roles y los 3 pueden verla, el riesgo es bajo |
| `crearTareaMantenimiento` (`mantenimiento/actions.ts:66`) | `requireAdminOrAsesor()` | **Protegida**: un `MANTENIMIENTO` recibe redirect |
| `reclamarTareaMantenimiento` (`actions.ts:155-165`) | `requireAuth()` + allowlist explícita de los 3 roles | **Protegida** (cualquier rol logueado puede reclamar: es el diseño) |
| `finalizar/desreclamarTareaMantenimiento` (`actions.ts:198-255, 257-314`) | `requireAuth()` + ownership o `ADMIN` | **Protegida**, con escritura condicional (ver §3) |
| `listMantenimientoTareas` (`dal.ts:579`) | sesión exigida | Lectura para cualquier logueado (diseño: los 3 roles la usan) |
| Link `/inmuebles/:id` renderizado dentro de `/mantenimiento` (`page.tsx:200-213`, `[id]/page.tsx:92-97`) | `getInmueble` solo exige sesión | **Fuga de UX**: el rol `MANTENIMIENTO` ve enlaces a inmuebles que el middleware le redirige a `/mantenimiento` al abrirlos |

Nota: no hay endpoints REST que auditar — fuera de `/api/auth/*` todo son Server Actions + lecturas DAL.

## 3. Módulo de tareas — "reclamar" y race condition

### 3.1 Tarea general (`src/app/tareas/actions.ts:192-230`)

```ts
await withTransaction(async (tx) => {
  const result = await tx.tarea.updateMany({
    where: { id, estado: "SIN_ASIGNAR" },
    data: { estado: "EN_PROGRESO", assignedToId: user.id },
  });
  if (result.count === 0) throw new Error("CONFLICT");
  await registrarActividad({ tx, tipo: "TAREA_RECLAMADA", ... });
});
```

**Sí hay protección contra doble reclamo**: el `updateMany` condicional es atómico — dos reclamos concurrentes, solo uno casa `estado: "SIN_ASIGNAR"`; el perdedor recibe `"La tarea ya fue reclamada por otro usuario"`. Patrón correcto.

Observación: esta action solo exige `requireAuth()`, sin check de rol. Un usuario `MANTENIMIENTO` no ve `/tareas` en el nav ni pasa el middleware de página, pero la action en sí no valida rol.

### 3.2 Tarea de mantenimiento (`src/app/mantenimiento/actions.ts:151-196`)

Mismo patrón correcto (`where: { id, tipo: "MANTENIMIENTO", estado: "SIN_ASIGNAR" }` + `CONFLICT`). Igual para `finalizar` y `desreclamar`, que usan `updateMany` con `where` incluyendo `estado` + `assignedToId` (`actions.ts:223-231, 282-290`).

### 3.3 Dicho explícitamente

- Reclamos (general y mantenimiento): **protegidos contra race condition**.
- Excepción: `liberarTarea` y `completarTarea` (tareas generales, `tareas/actions.ts:232-324`) hacen `findUnique` → validan en JS → `update({ where: { id } })` **sin condición de estado en la escritura**. Hay ventana TOCTOU: el estado puede cambiar entre la lectura y el `update`. Los pares de mantenimiento no tienen este defecto.

## 4. Modelo de datos

Archivo completo: `prisma/schema.prisma` (259 líneas; se reproduce íntegro por pedido expreso).

Punto clave: **no existe tabla `Mantenimiento`**. Mantenimiento es `Tarea` con `tipo = MANTENIMIENTO` (`enum TareaTipo { GENERAL, MANTENIMIENTO }`) más `contacto` (`ARRENDATARIO | PROPIETARIO | null`). Hay migración `20260826215331_add_mantenimiento`.

Relaciones:

- `Usuario` 1—N `Inmueble` (creador/modificador, `onDelete: Restrict`), `Nota`, `Tarea` (creadas/asignadas), `SoporteTicket` (creados/cerrados), `SoporteMensaje`, `Actividad`.
- `Inmueble` 1—N `Nota` (`Cascade`), `Tarea` (`SetNull`), `Actividad` (`SetNull`).
- `Tarea` N—1 `Inmueble?`, N—1 creador, N—1 asignado `?`; 1—N `Actividad`.
- `SoporteTicket` 1—N `SoporteMensaje` (`Cascade`), `Actividad`.
- `Actividad` es tabla de auditoría polimorfa: `entidad/entidadId` + FKs opcionales (`inmuebleId/tareaId/soporteTicketId`, `SetNull`).

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Usuario {
  id           String     @id @default(cuid())
  nombre       String
  username     String     @unique
  passwordHash String
  rol          Rol        @default(ASESOR)
  estado       Estado     @default(ACTIVO)
  sessionVersion Int      @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  inmueblesCreados    Inmueble[] @relation("InmuebleCreador")
  inmueblesModificados Inmueble[] @relation("InmuebleModificador")
  notas               Nota[]
  tareasCreadas       Tarea[]  @relation("TareaCreador")
  tareasAsignadas     Tarea[]  @relation("TareaAsignada")
  soporteTicketsCreados   SoporteTicket[] @relation("SoporteTicketCreador")
  soporteTicketsCerrados  SoporteTicket[] @relation("SoporteTicketCerrador")
  soporteMensajes         SoporteMensaje[]
  actividades             Actividad[]

  @@map("usuarios")
}

model Inmueble {
  id         String     @id @default(cuid())
  noInm      String     @unique
  barrio     String?
  ciudad     String?
  tipoInmueble String?
  destinacion  Destinacion?
  direccion    String?
  docArrendatario String?
  arrendatario    String?
  celArre1        String?
  emailArre       String?
  docPropietario  String?
  propietario     String?
  emailPro        String?
  celPro1         String?
  vigenciaContrato String?
  nomAdmin        String?
  observaciones   String?
  estado          InmuebleEstado @default(ACTIVO)
  createdById     String
  updatedById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  creadoPor       Usuario  @relation("InmuebleCreador", fields: [createdById], references: [id], onDelete: Restrict)
  modificadoPor   Usuario  @relation("InmuebleModificador", fields: [updatedById], references: [id], onDelete: Restrict)
  notas           Nota[]

  @@index([ciudad])
  @@index([barrio])
  @@index([tipoInmueble])
  @@index([destinacion])
  @@index([estado])
  tareas          Tarea[]
  actividades     Actividad[]
  @@map("inmuebles")
}

model Nota {
  id         String   @id @default(cuid())
  contenido  String
  inmuebleId String
  authorId   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  inmueble   Inmueble @relation(fields: [inmuebleId], references: [id], onDelete: Cascade)
  autor      Usuario  @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([inmuebleId])
  @@index([authorId])
  @@map("notas")
}

model Tarea {
  id           String   @id @default(cuid())
  titulo       String
  descripcion  String?
  inmuebleId   String?
  fechaLimite  DateTime?
  importante   Boolean  @default(false)
  urgente      Boolean  @default(false)
  estado       TareaEstado @default(SIN_ASIGNAR)
  tipo         TareaTipo @default(GENERAL)
  contacto     ContactoTarea?
  createdById  String
  assignedToId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  completedAt  DateTime?
  creadoPor    Usuario  @relation("TareaCreador", fields: [createdById], references: [id], onDelete: Restrict)
  asignadaA    Usuario? @relation("TareaAsignada", fields: [assignedToId], references: [id], onDelete: Restrict)
  inmueble     Inmueble? @relation(fields: [inmuebleId], references: [id], onDelete: SetNull)
  actividades  Actividad[]

  @@index([estado])
  @@index([tipo])
  @@index([assignedToId])
  @@index([inmuebleId])
  @@index([fechaLimite])
  @@map("tareas")
}

enum Rol { ADMIN ASESOR MANTENIMIENTO }
enum TareaTipo { GENERAL MANTENIMIENTO }
enum ContactoTarea { ARRENDATARIO PROPIETARIO }
enum Estado { ACTIVO INACTIVO }
enum Destinacion { VIVIENDA COMERCIO }
enum InmuebleEstado { ACTIVO ARCHIVADO }
enum TareaEstado { SIN_ASIGNAR EN_PROGRESO COMPLETADA CANCELADA ARCHIVADA }

model Actividad {
  id          String         @id @default(cuid())
  tipo        ActividadTipo
  entidad     EntidadTipo
  entidadId   String
  userId      String
  context     String?
  inmuebleId  String?
  tareaId     String?
  soporteTicketId String?
  createdAt   DateTime       @default(now())
  usuario     Usuario        @relation(fields: [userId], references: [id], onDelete: Restrict)
  inmueble    Inmueble?      @relation(fields: [inmuebleId], references: [id], onDelete: SetNull)
  tarea       Tarea?         @relation(fields: [tareaId], references: [id], onDelete: SetNull)
  soporteTicket SoporteTicket? @relation(fields: [soporteTicketId], references: [id], onDelete: SetNull)

  @@index([entidad, entidadId])
  @@index([inmuebleId])
  @@index([tareaId])
  @@index([soporteTicketId])
  @@index([createdAt])
  @@map("actividad")
}

model SoporteTicket {
  id           String           @id @default(cuid())
  titulo       String
  descripcion  String
  prioridad    TicketPrioridad  @default(NORMAL)
  estado       TicketEstado     @default(ABIERTO)
  createdById  String
  resolvedAt   DateTime?
  cerradoPorId String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  creadoPor    Usuario          @relation("SoporteTicketCreador",  fields: [createdById],  references: [id], onDelete: Restrict)
  cerradoPor   Usuario?         @relation("SoporteTicketCerrador", fields: [cerradoPorId], references: [id], onDelete: SetNull)
  mensajes     SoporteMensaje[]
  actividades  Actividad[]

  @@index([estado])
  @@index([createdById])
  @@index([createdAt])
  @@map("soporte_tickets")
}

model SoporteMensaje {
  id        String        @id @default(cuid())
  ticketId  String
  authorId  String
  contenido String
  createdAt DateTime      @default(now())
  ticket    SoporteTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  autor     Usuario       @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([ticketId])
  @@map("soporte_mensajes")
}

enum TicketPrioridad { BAJA NORMAL ALTA URGENTE }
enum TicketEstado { ABIERTO EN_PROGRESO RESUELTO CERRADO CANCELADO }
enum ActividadTipo {
  INMUEBLE_CREADO INMUEBLE_EDITADO INMUEBLE_ARCHIVADO INMUEBLE_RESTAURADO
  NOTA_CREADA TAREA_CREADA TAREA_RECLAMADA TAREA_LIBERADA TAREA_COMPLETADA
  SOPORTE_CREADO SOPORTE_EN_PROGRESO SOPORTE_RESUELTO SOPORTE_CERRADO
  SOPORTE_CANCELADO SOPORTE_COMENTADO SOPORTE_PRIORIDAD
  USUARIO_PASSWORD_CAMBIADO USUARIO_PASSWORD_RESETEADO
  MANTENIMIENTO_TAREA_CREADA MANTENIMIENTO_TAREA_RECLAMADA
  MANTENIMIENTO_TAREA_FINALIZADA MANTENIMIENTO_TAREA_LIBERADA
}
enum EntidadTipo { INMUEBLE NOTA TAREA SOPORTE USUARIO }
```

## 5. Seguridad básica

### 5.1 Validación de input: zod casi en todas partes

- Login: `credentialsSchema` (`auth.ts:16-19`). IDs de actions: chequeo manual `String(formData.get("id") ?? "")` + `if (!id)`.
- Tareas (`tareas/actions.ts:47-82`): `crearSchema` con título 1–200, descripción ≤4000, y `fechaLimiteSchema` con zona `America/Bogota`, fecha real (`isRealISODate`) y rango hoy…+5 años.
- Mantenimiento (`mantenimiento/actions.ts:13-43`): `crearSchema` con título/descripción/inmueble/contacto/fecha, pero la fecha **solo valida formato `/^\d{4}-\d{2}-\d{2}$/`** — acepta `2026-02-30` y fechas pasadas o a 50 años. Más débil que el de tareas generales.
- Inmuebles (`inmuebles/actions.ts:11-62`): `camposBase` con longitudes máximas y emails normalizados a minúsculas; `updateSchema` prohíbe cambiar `noInm`. Notas, perfil (min 8 + confirmación), usuarios y soporte también usan zod (grep: 13 archivos importan `zod`).

### 5.2 Endpoints sin verificación de sesión

- Públicos legítimos: `/login` y `/api/auth/*` (gestionado por Auth.js; el matcher de `proxy.ts:17` excluye `/api` a propósito con el motivo documentado).
- Grises (exigen sesión solo vía middleware, no en la función): `getMantenimientoTarea`, `getMantenimientoResumen` (`dal.ts`) y `listarActividad*` (`audit.ts`, sin auth alguna). Hoy solo se llaman desde páginas ya redirigidas por middleware, pero cualquier reutilización futura hereda el hueco.

### 5.3 Sesiones Auth.js

Estrategia **JWT** (`auth.ts:22`), no database sessions. Revocación por `sessionVersion`: cambiar la contraseña hace `sessionVersion: { increment: 1 }` (`perfil/actions.ts`), y el callback `jwt` invalida tokens viejos. Rate-limit de login en memoria (`src/lib/rate-limit.ts`: 5 intentos / 15 min, bloqueo exponencial hasta 24 h, `Map` + limpieza cada 60 s) — funciona en una sola instancia; en despliegue multi-instancia no se comparte. Notificaciones Telegram en soporte son fail-soft (`soporte/actions.ts:104`).

## 6. Deuda técnica visible

1. `src/lib/dal.ts` (1.195 líneas): DAL-dios con todos los dominios; `src/generated/prisma` versionado en el repo.
2. Paginación muerta en mantenimiento: `listMantenimientoTareas` (`dal.ts:579-664`) acepta `options.cursor` pero **nunca lo aplica al `where`** (no hay `decodeCursor`); calcula `nextCursor` sobre una query sin cursor, así que "cargar más" repetiría la primera página.
3. `liberarTarea` / `completarTarea` generales con TOCTOU (§3.3); sus equivalentes de mantenimiento ya usan `updateMany` condicional.
4. Validación de fecha débil en crear-mantenimiento (§5.1).
5. `requireMantenimiento` sin uso; `getMantenimientoTarea/Resumen` y `listarActividad*` sin enforce de sesión (§2.2).
6. Mojibake en `src/lib/audit.ts:88`: `INMUEBLE_RESTAURADO: "�"`.
7. Duplicación: `formatFieldErrors` copiado en 4 `actions.ts`; `ESTADO_LABEL`/`EstadoBadge` repetidos en `tareas/page.tsx` vs `mantenimiento/page.tsx`; patrón `AccionButton` duplicado entre módulos.
8. Cero `TODO`/`FIXME` literales en `src` (el grep solo devuelve "Todos" de UI). `console.*` solo en logs intencionales de auth/telegram y en `scripts/`.
9. Cobertura existente: `tests/` tiene 11 suites (`tareas`, `mantenimiento`, `soporte`, `dal-soporte-acceso`, `rate-limit`, etc.) — punto de partida sano para cubrir los huecos 2–5.
