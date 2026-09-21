export interface VersionRelease {
  version: string;
  date: string;
  title: string;
  type: "major" | "minor" | "patch";
  highlights: string[];
}

export const APP_VERSION = "1.2.1";

export const APP_CHANGELOG: VersionRelease[] = [
  {
    version: "1.2.1",
    date: "2026-09-21",
    title: "Optimización de Conectividad y Mejoras de Navegación",
    type: "patch",
    highlights: [
      "Ocultamiento de barra visual de scroll en la cabecera manteniendo deslizamiento horizontal fluido.",
      "Truncamiento responsivo de nombres de usuario extensos en el header con tooltip informativo.",
      "Soporte automático para conexión agrupada (POSTGRES_URL) en serverless para evitar saturación de conexiones.",
      "Aseguramiento de estabilidad en botones de navegación (shrink-0 y whitespace-nowrap).",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-09-20",
    title: "Panel de Métricas, Presencia en Vivo y Auditoría Inmutable",
    type: "minor",
    highlights: [
      "Panel de métricas exclusivo para administradores (/administracion/panel) con KPIs de cartera y mantenimiento.",
      "Monitoreo de presencia en tiempo real con latidos periódicos de 60 segundos.",
      "Auditoría inmutable de transacciones protegida en 3 capas (Aplicación, ORM Prisma y Triggers SQL).",
      "Tarea programada cron para retención y depuración automática de eventos de auditoría y presencia.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-09-20",
    title: "Modo Oscuro, Búsqueda Priorizada y Políticas Legales",
    type: "minor",
    highlights: [
      "Soporte completo para Modo Oscuro (Dark Mode) con detección automática y botón de cambio de tema.",
      "Búsqueda prioritaria por número exacto de inmueble (No. Inm) con ordenamiento natural.",
      "Filas de tabla de inmuebles completamente clickeables con efectos de interacción.",
      "Páginas públicas de Términos y Condiciones (/terminos) y Política de Privacidad (/privacidad) bajo Ley 1581.",
      "Habilitación de archivado de inmuebles para asesores comerciales.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-09-18",
    title: "Lanzamiento Inicial del Sistema",
    type: "major",
    highlights: [
      "Gestión de inventario inmobiliario (creación, edición, consulta y exportación).",
      "Módulo de tareas operativas y solicitudes de mantenimiento con estados y prioridades.",
      "Módulo de soporte técnico interno con seguimiento de tickets.",
      "Control de acceso basado en roles (ADMINISTRADOR, ASESOR, MANTENIMIENTO) y seguridad con NextAuth.",
    ],
  },
];
