import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ActividadItem = {
  id: string;
  tipo: string;
  user: string;
  context: string | null;
  createdAt: Date;
};

export async function listarActividadInmueble(
  inmuebleId: string
): Promise<ActividadItem[]> {
  const rows = await prisma.actividad.findMany({
    where: { inmuebleId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      context: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    user: r.usuario.nombre,
    context: r.context,
    createdAt: r.createdAt,
  }));
}

export async function listarActividadTarea(
  tareaId: string
): Promise<ActividadItem[]> {
  const rows = await prisma.actividad.findMany({
    where: { tareaId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      context: true,
      createdAt: true,
      usuario: { select: { nombre: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    user: r.usuario.nombre,
    context: r.context,
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
};

export const ACTIVIDAD_PREFIX: Record<string, string> = {
  INMUEBLE_CREADO: "+",
  INMUEBLE_EDITADO: "✎",
  INMUEBLE_ARCHIVADO: "■",
  INMUEBLE_RESTAURADO: "↻",
  NOTA_CREADA: "✎",
  TAREA_CREADA: "+",
  TAREA_RECLAMADA: "▶",
  TAREA_LIBERADA: "⏸",
  TAREA_COMPLETADA: "✓",
};

type RegistrarArgs = {
  tx: Prisma.TransactionClient;
  tipo:
    | "INMUEBLE_CREADO"
    | "INMUEBLE_EDITADO"
    | "INMUEBLE_ARCHIVADO"
    | "INMUEBLE_RESTAURADO"
    | "NOTA_CREADA"
    | "TAREA_CREADA"
    | "TAREA_RECLAMADA"
    | "TAREA_LIBERADA"
    | "TAREA_COMPLETADA";
  entidad: "INMUEBLE" | "NOTA" | "TAREA";
  entidadId: string;
  userId: string;
  context?: string | null;
  inmuebleId?: string | null;
  tareaId?: string | null;
};

export async function registrarActividad(args: RegistrarArgs): Promise<void> {
  await args.tx.actividad.create({
    data: {
      tipo: args.tipo,
      entidad: args.entidad,
      entidadId: args.entidadId,
      userId: args.userId,
      context: args.context ?? null,
      inmuebleId: args.inmuebleId ?? null,
      tareaId: args.tareaId ?? null,
    },
  });
}

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
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
