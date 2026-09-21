import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma, type TransactionClient } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";

export type ActividadItem = {
  id: string;
  tipo: string;
  user: string;
  context: string | null;
  ip?: string | null;
  dispositivo?: string | null;
  cambios?: Prisma.JsonValue | null;
  createdAt: Date;
};

export async function listarActividadInmueble(
  inmuebleId: string
): Promise<ActividadItem[]> {
  await requireAuth();
  const rows = await prisma.actividad.findMany({
    where: { inmuebleId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      context: true,
      ip: true,
      dispositivo: true,
      cambios: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    user: r.usuario.nombre,
    context: r.context,
    ip: r.ip,
    dispositivo: r.dispositivo,
    cambios: r.cambios,
    createdAt: r.createdAt,
  }));
}

export async function listarActividadTarea(
  tareaId: string
): Promise<ActividadItem[]> {
  await requireAuth();
  const rows = await prisma.actividad.findMany({
    where: { tareaId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      context: true,
      ip: true,
      dispositivo: true,
      cambios: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    user: r.usuario.nombre,
    context: r.context,
    ip: r.ip,
    dispositivo: r.dispositivo,
    cambios: r.cambios,
    createdAt: r.createdAt,
  }));
}

export const ACTIVIDAD_LABELS: Record<string, string> = {
  INMUEBLE_CREADO: "Inmueble creado",
  INMUEBLE_EDITADO: "Inmueble editado",
  INMUEBLE_ARCHIVADO: "Inmueble archivado",
  INMUEBLE_RESTAURADO: "Inmueble restaurado",
  NOTA_CREADA: "Nota creada",
  TAREA_CREADA: "Tarea creada",
  TAREA_RECLAMADA: "Tarea reclamada",
  TAREA_LIBERADA: "Tarea liberada",
  TAREA_COMPLETADA: "Tarea completada",
  SOPORTE_CREADO: "Ticket creado",
  SOPORTE_EN_PROGRESO: "Ticket en progreso",
  SOPORTE_RESUELTO: "Ticket resuelto",
  SOPORTE_CERRADO: "Ticket cerrado",
  SOPORTE_CANCELADO: "Ticket cancelado",
  SOPORTE_COMENTADO: "Ticket comentado",
  SOPORTE_PRIORIDAD: "Prioridad cambiada",
  USUARIO_PASSWORD_CAMBIADO: "Contraseña actualizada",
  USUARIO_PASSWORD_RESETEADO: "Contraseña reseteada por admin",
  USUARIO_CREADO: "Usuario creado",
  USUARIO_EDITADO: "Usuario editado",
  USUARIO_ESTADO_CAMBIADO: "Estado de usuario cambiado",
  INMUEBLES_EXPORTADOS: "Inmuebles exportados",
  TAREAS_EXPORTADAS: "Tareas exportadas",
  MANTENIMIENTO_TAREA_CREADA: "Tarea de mantenimiento creada",
  MANTENIMIENTO_TAREA_RECLAMADA: "Tarea de mantenimiento reclamada",
  MANTENIMIENTO_TAREA_FINALIZADA: "Tarea de mantenimiento finalizada",
  MANTENIMIENTO_TAREA_LIBERADA: "Tarea de mantenimiento desreclamada",
};

export const ACTIVIDAD_PREFIX: Record<string, string> = {
  INMUEBLE_CREADO: "+",
  INMUEBLE_EDITADO: "✎",
  INMUEBLE_ARCHIVADO: "■",
  INMUEBLE_RESTAURADO: "↺",
  NOTA_CREADA: "✎",
  TAREA_CREADA: "+",
  TAREA_RECLAMADA: "▶",
  TAREA_LIBERADA: "⏸",
  TAREA_COMPLETADA: "✓",
  SOPORTE_CREADO: "🎟",
  SOPORTE_EN_PROGRESO: "⏳",
  SOPORTE_RESUELTO: "✓",
  SOPORTE_CERRADO: "■",
  SOPORTE_CANCELADO: "✕",
  SOPORTE_COMENTADO: "💬",
  SOPORTE_PRIORIDAD: "⚑",
  USUARIO_PASSWORD_CAMBIADO: "🔑",
  USUARIO_PASSWORD_RESETEADO: "🔑",
  USUARIO_CREADO: "+👤",
  USUARIO_EDITADO: "✎👤",
  USUARIO_ESTADO_CAMBIADO: "⚑👤",
  INMUEBLES_EXPORTADOS: "📥",
  TAREAS_EXPORTADAS: "📥",
  MANTENIMIENTO_TAREA_CREADA: "🛠",
  MANTENIMIENTO_TAREA_RECLAMADA: "▶",
  MANTENIMIENTO_TAREA_FINALIZADA: "✓",
  MANTENIMIENTO_TAREA_LIBERADA: "⏸",
};

const CAMPOS_SENSIBLES_SIN_VALOR = new Set([
  "password",
  "passwordHash",
  "token",
  "secret",
  "cookie",
  "contenido",
  "observaciones",
  "descripcion",
]);

const CAMPOS_DATOS_PERSONALES = new Set([
  "docArrendatario",
  "arrendatario",
  "celArre1",
  "celArre2",
  "emailArre",
  "docPropietario",
  "propietario",
  "celPro1",
  "celPro2",
  "emailPro",
]);

export function calcularCambiosAuditables(
  antes: Record<string, unknown>,
  despues: Record<string, unknown>
): Record<string, { anterior: string | null; nuevo: string | null }> | null {
  const cambios: Record<string, { anterior: string | null; nuevo: string | null }> = {};
  const allKeys = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  const ignoreKeys = new Set([
    "createdAt",
    "updatedAt",
    "id",
    "createdById",
    "updatedById",
    "sessionVersion",
  ]);

  for (const key of allKeys) {
    if (ignoreKeys.has(key)) continue;

    const valAntes = antes[key];
    const valDespues = despues[key];

    const a = valAntes === undefined ? null : valAntes;
    const b = valDespues === undefined ? null : valDespues;

    if (JSON.stringify(a) !== JSON.stringify(b)) {
      if (CAMPOS_SENSIBLES_SIN_VALOR.has(key)) {
        cambios[key] = { anterior: "[MODIFICADO]", nuevo: "[MODIFICADO]" };
      } else if (CAMPOS_DATOS_PERSONALES.has(key)) {
        cambios[key] = { anterior: "[DATO_PERSONAL_RESERVADO]", nuevo: "[DATO_PERSONAL_RESERVADO]" };
      } else {
        cambios[key] = {
          anterior: a !== null ? String(a) : null,
          nuevo: b !== null ? String(b) : null,
        };
      }
    }
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}

export type RegistrarArgs = {
  tx?: TransactionClient;
  tipo:
    | "INMUEBLE_CREADO"
    | "INMUEBLE_EDITADO"
    | "INMUEBLE_ARCHIVADO"
    | "INMUEBLE_RESTAURADO"
    | "NOTA_CREADA"
    | "TAREA_CREADA"
    | "TAREA_RECLAMADA"
    | "TAREA_LIBERADA"
    | "TAREA_COMPLETADA"
    | "SOPORTE_CREADO"
    | "SOPORTE_EN_PROGRESO"
    | "SOPORTE_RESUELTO"
    | "SOPORTE_CERRADO"
    | "SOPORTE_CANCELADO"
    | "SOPORTE_COMENTADO"
    | "SOPORTE_PRIORIDAD"
    | "USUARIO_PASSWORD_CAMBIADO"
    | "USUARIO_PASSWORD_RESETEADO"
    | "USUARIO_CREADO"
    | "USUARIO_EDITADO"
    | "USUARIO_ESTADO_CAMBIADO"
    | "INMUEBLES_EXPORTADOS"
    | "TAREAS_EXPORTADAS"
    | "MANTENIMIENTO_TAREA_CREADA"
    | "MANTENIMIENTO_TAREA_RECLAMADA"
    | "MANTENIMIENTO_TAREA_FINALIZADA"
    | "MANTENIMIENTO_TAREA_LIBERADA";
  entidad: "INMUEBLE" | "NOTA" | "TAREA" | "SOPORTE" | "USUARIO";
  entidadId: string;
  userId: string;
  context?: string | null;
  ip?: string | null;
  dispositivo?: string | null;
  cambios?: Prisma.InputJsonValue | null;
  inmuebleId?: string | null;
  tareaId?: string | null;
  soporteTicketId?: string | null;
};

export async function registrarActividad(args: RegistrarArgs): Promise<void> {
  const client = args.tx ?? prisma;
  await client.actividad.create({
    data: {
      tipo: args.tipo,
      entidad: args.entidad,
      entidadId: args.entidadId,
      userId: args.userId,
      context: args.context ?? null,
      ip: args.ip ?? null,
      dispositivo: args.dispositivo ?? null,
      cambios: (args.cambios ?? undefined) as Prisma.InputJsonValue | undefined,
      inmuebleId: args.inmuebleId ?? null,
      tareaId: args.tareaId ?? null,
      soporteTicketId: args.soporteTicketId ?? null,
    },
  });
}

export type RegistrarAccesoArgs = {
  userId?: string | null;
  username: string;
  tipo: "LOGIN_EXITOSO" | "LOGIN_FALLIDO" | "LOGOUT";
  motivo?: string | null;
  ip: string;
  dispositivo?: string | null;
  navegador?: string | null;
  sistemaOperativo?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  userAgent?: string | null;
};

export async function registrarAcceso(args: RegistrarAccesoArgs): Promise<void> {
  await prisma.registroAcceso.create({
    data: {
      userId: args.userId ?? null,
      username: args.username,
      tipo: args.tipo,
      motivo: args.motivo ?? null,
      ip: args.ip,
      dispositivo: args.dispositivo ?? null,
      navegador: args.navegador ?? null,
      sistemaOperativo: args.sistemaOperativo ?? null,
      pais: args.pais ?? null,
      ciudad: args.ciudad ?? null,
      userAgent: args.userAgent ?? null,
    },
  });
}

export type RegistrarPresenciaArgs = {
  sessionId: string;
  userId: string;
  rutaActual: string;
  ip: string;
  dispositivo?: string | null;
  navegador?: string | null;
  sistemaOperativo?: string | null;
};

export async function registrarPresencia(args: RegistrarPresenciaArgs): Promise<void> {
  await prisma.sesionPresencia.upsert({
    where: { sessionId: args.sessionId },
    create: {
      sessionId: args.sessionId,
      userId: args.userId,
      rutaActual: args.rutaActual,
      ip: args.ip,
      dispositivo: args.dispositivo ?? null,
      navegador: args.navegador ?? null,
      sistemaOperativo: args.sistemaOperativo ?? null,
    },
    update: {
      userId: args.userId,
      rutaActual: args.rutaActual,
      ip: args.ip,
      dispositivo: args.dispositivo ?? null,
      navegador: args.navegador ?? null,
      sistemaOperativo: args.sistemaOperativo ?? null,
      ultimaActividad: new Date(),
    },
  });
}

export async function cerrarPresencia(sessionId: string): Promise<void> {
  await prisma.sesionPresencia.deleteMany({
    where: { sessionId },
  });
}

export async function cerrarPresenciaPorUsuario(userId: string): Promise<void> {
  await prisma.sesionPresencia.deleteMany({
    where: { userId },
  });
}

export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return (prisma.$transaction as (f: (t: TransactionClient) => Promise<T>) => Promise<T>)(fn);
}

export type ActividadGlobalItem = ActividadItem & {
  href: string;
};

export async function listarActividadReciente(
  limit = 10
): Promise<ActividadGlobalItem[]> {
  const rows = await prisma.actividad.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      tipo: true,
      entidad: true,
      entidadId: true,
      context: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
      tarea: { select: { id: true, titulo: true } },
      inmueble: { select: { id: true, noInm: true } },
      soporteTicket: { select: { id: true, titulo: true } },
    },
  });

  return rows.map((r) => {
    let href = "/dashboard";
    if (r.entidad === "INMUEBLE" && r.inmueble) {
      href = `/inmuebles/${r.inmueble.id}`;
    } else if (r.entidad === "TAREA" && r.tarea) {
      href = `/tareas/${r.tarea.id}`;
    } else if (r.entidad === "NOTA" && r.inmueble) {
      href = `/inmuebles/${r.inmueble.id}`;
    } else if (r.entidad === "SOPORTE" && r.soporteTicket) {
      href = `/soporte/${r.soporteTicket.id}`;
    }
    return {
      id: r.id,
      tipo: r.tipo,
      user: r.usuario.nombre,
      context: r.context,
      createdAt: r.createdAt,
      href,
    };
  });
}
