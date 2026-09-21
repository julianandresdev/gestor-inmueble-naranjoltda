# Registro de Cambios (Changelog) - Gestión Inmobiliaria Naranjo

Todas las modificaciones notables de este proyecto están documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [1.2.1] - 2026-09-21

### Corregido
- Ocultada la barra visual gruesa de desplazamiento en la cabecera de navegación (`AppNav`) en todos los navegadores mediante `.no-scrollbar`, manteniendo el scroll horizontal activo con trackpad, gestos táctiles y Shift+rueda.
- Truncado responsivo del nombre y rol de usuario en la barra superior con `title` emergente para evitar compresión de los enlaces del menú.
- Adicionadas clases `shrink-0 whitespace-nowrap` a `NavLink` para evitar que los elementos colapsen al desplazarse.
- Añadido soporte prioritario para conexión de pooler `POSTGRES_URL` en serverless Vercel, resolviendo el error `P2037: Too many connections for role "prisma_migration"`.

---

## [1.2.0] - 2026-09-20

### Añadido
- Panel de métricas y supervisión administrativa en `/administracion/panel` con indicadores de cartera, actividad de usuarios y estado del sistema.
- Sistema de presencia de usuarios en tiempo real mediante latidos (heartbeats) de 60 segundos y detección de inactividad.
- Trazabilidad y auditoría de cambios inmutable en 3 capas de seguridad: Capa Aplicativa, Capa ORM Prisma y Triggers SQL en PostgreSQL (bloqueo estricto de `UPDATE`/`DELETE` en `actividad` y `registro_accesos`).
- Endpoint de cron `/api/cron/retencion` protegido con `CRON_SECRET` para purga programada de registros antiguos (12 meses auditoría / 24 horas sesiones de presencia).
- Filtros de auditoría por rango de fechas, usuario y tipo de acción en el panel administrativo.

---

## [1.1.0] - 2026-09-20

### Añadido
- Modo Oscuro (Dark Mode) con detección automática (`prefers-color-scheme`), prevención de parpadeo (Anti-FOUC) y alternador en el encabezado.
- Búsqueda con prioridad en inventario de inmuebles: coincidencia exacta por `No. Inm`, prefijo numérico y subcadena.
- Filas de tabla de inmuebles completamente clickeables con navegación directa a detalle.
- Páginas públicas de Términos y Condiciones (`/terminos`) y Política de Privacidad (`/privacidad`) adaptadas a la Ley 1581 de 2012 (Habeas Data).
- Permiso de archivado de inmuebles habilitado para asesores comerciales (`ASESOR`).
- Renombramiento de ruta y títulos de navegación de "Dashboard" a "Inicio".

---

## [1.0.0] - 2026-09-18

### Añadido
- Lanzamiento inicial de la plataforma de Gestión Inmobiliaria Naranjo.
- Módulo de gestión y catálogo de inmuebles con carga masiva XLSX.
- Módulo de tareas operativas y mantenimiento con estados, fechas y responsables.
- Módulo de tickets de soporte técnico interno.
- Autenticación segura mediante NextAuth v5 con sesiones JWT y roles (`ADMINISTRADOR`, `ASESOR`, `MANTENIMIENTO`).
