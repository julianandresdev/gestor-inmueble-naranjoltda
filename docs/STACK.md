# Stack Tecnológico

## Objetivo

Aplicación web interna para la gestión de inmuebles, seguimiento y tareas de una inmobiliaria.

El desarrollo será incremental por fases. Se mantendrá una arquitectura simple, mantenible y escalable, evitando complejidad innecesaria como microservicios o múltiples aplicaciones independientes.

La aplicación utilizará un enfoque full-stack dentro de un único proyecto.

---

# Stack principal

| Área | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js |
| UI | React |
| Estilos | Tailwind CSS |
| Componentes UI | shadcn/ui |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | Auth.js |
| Formularios | React Hook Form |
| Validación | Zod |
| Tests unitarios | Vitest |
| Tests E2E | Playwright |
| Contenedores | Docker + Docker Compose |

---

# Arquitectura

La aplicación se desarrollará como un único proyecto full-stack utilizando Next.js.

```text
Usuario
   │
   ▼
Next.js
├── Interfaz de usuario
├── Autenticación
├── Lógica de negocio
├── Server Actions / Route Handlers
└── Acceso a datos
         │
         ▼
       Prisma
         │
         ▼
    PostgreSQL
```

No se utilizarán microservicios para el MVP.

---

# Frontend

## Next.js + React + TypeScript

Next.js será utilizado tanto para la interfaz como para la lógica del servidor necesaria para la aplicación.

Se utilizará TypeScript en todo el proyecto.

Rutas previstas:

```text
/login
/dashboard

/inmuebles
/inmuebles/nuevo
/inmuebles/[id]
/inmuebles/[id]/editar

/tareas
/tareas/nueva
/tareas/[id]

/administracion/usuarios
/administracion/archivados
```

Se recomienda utilizar Server Components por defecto y Client Components únicamente cuando sean necesarios para interacción del usuario.

---

# Estilos y componentes

## Tailwind CSS

Tailwind CSS será utilizado para los estilos de la aplicación.

## shadcn/ui

Se utilizará shadcn/ui para componentes reutilizables de interfaz, incluyendo:

- Buttons
- Inputs
- Selects
- Tables
- Dialogs
- Tabs
- Cards
- Badges
- Dropdowns
- Alerts
- Formularios

Los componentes deben reutilizarse para mantener una interfaz consistente.

---

# Base de datos

## PostgreSQL

PostgreSQL será la base de datos principal.

La aplicación utiliza información altamente relacionada:

- Usuarios
- Inmuebles
- Notas
- Tareas
- Actividad y trazabilidad

Se utilizará una base de datos relacional para garantizar:

- Integridad de datos.
- Relaciones mediante claves foráneas.
- Restricciones.
- Transacciones.
- Control de concurrencia.
- Índices para búsqueda y filtrado.

---

# ORM

## Prisma

Prisma será el ORM utilizado para comunicarse con PostgreSQL.

Será responsable de:

- Definición del esquema.
- Relaciones entre entidades.
- Migraciones.
- Acceso tipado a los datos.

Las modificaciones de la estructura de la base de datos deben realizarse mediante migraciones.

No se deben realizar cambios manuales en producción sin una migración correspondiente.

---

# Autenticación

## Auth.js

La autenticación será mediante:

- Usuario.
- Contraseña.

No habrá registro público. Los usuarios serán creados y gestionados por un administrador.

La aplicación debe manejar:

- Inicio de sesión.
- Sesiones.
- Cierre de sesión.
- Protección de rutas.
- Roles.
- Usuarios activos e inactivos.

Roles iniciales:

```text
ADMIN
ASESOR
```

Las contraseñas nunca deben almacenarse en texto plano.

---

# Formularios y validación

## React Hook Form

Se utilizará para manejar formularios, especialmente:

- Inmuebles.
- Usuarios.
- Tareas.
- Notas.

## Zod

Zod será utilizado para definir y validar los datos.

Las validaciones importantes deben ejecutarse también en el servidor. La validación del frontend no es suficiente para garantizar la integridad de los datos.

---

# Lógica del servidor

La lógica del servidor se implementará principalmente utilizando:

- Server Actions.
- Server Components.
- Route Handlers cuando sea necesario.

No se debe crear una API REST completa si no existe una necesidad real.

La lógica de negocio y las validaciones de permisos no deben depender únicamente del frontend.

---

# Testing

El testing se incorporará progresivamente.

## Vitest

Se utilizará para:

- Lógica de negocio.
- Validaciones.
- Permisos.
- Funciones críticas.

## Playwright

Se utilizará para pruebas end-to-end de flujos críticos una vez las funcionalidades principales estén implementadas.

Ejemplo:

```text
Login
→ Crear inmueble
→ Editar inmueble
→ Crear tarea
→ Reclamar tarea
→ Completar tarea
```

---

# Docker

Se utilizará Docker y Docker Compose para facilitar la ejecución y despliegue.

Estructura inicial:

```text
Docker Compose
├── Aplicación Next.js
└── PostgreSQL
```

La configuración debe utilizar variables de entorno.

Las credenciales y secretos no deben incluirse directamente en el código ni subirse al repositorio.

---

# Principios de desarrollo

- Mantener una arquitectura simple.
- Evitar sobreingeniería.
- No implementar funcionalidades futuras sin necesidad.
- Reutilizar componentes y lógica cuando sea apropiado.
- Mantener TypeScript estricto.
- Validar datos en el servidor.
- Aplicar autorización en el servidor.
- Utilizar migraciones para cambios en la base de datos.
- No almacenar contraseñas en texto plano.
- No eliminar permanentemente información desde la aplicación.
- Mantener trazabilidad de acciones importantes.
- Mantener el proyecto funcional después de cada fase.

---

# Desarrollo por fases

El agente de código no debe intentar desarrollar todo el proyecto utilizando únicamente este documento.

Proceso:

1. Recibir el contexto y los documentos del proyecto.
2. Recibir instrucciones específicas para una única fase.
3. Implementar únicamente el alcance solicitado.
4. No adelantarse a fases posteriores.
5. Mantener compatibilidad con las decisiones ya tomadas.
6. Corregir errores encontrados antes de continuar.
7. Esperar la siguiente fase antes de implementar nuevas funcionalidades.

Cada fase será definida y entregada por separado.
