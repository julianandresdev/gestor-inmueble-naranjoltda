"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { notifyTicket } from "@/lib/telegram";
import type { TicketAccion } from "@/lib/telegram";
import { z } from "zod";
import type { TicketEstado, TicketPrioridad } from "@/generated/prisma/client";
import type { SoporteAccionState, SoporteFormState } from "./types";

const crearSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "El título es demasiado largo"),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(8000, "La descripción es demasiado larga"),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
});

const cambiarEstadoSchema = z.object({
  id: z.string().trim().min(1, "ID inválido"),
  estado: z.enum(["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"]),
});

const mensajeSchema = z.object({
  id: z.string().trim().min(1, "ID inválido"),
  contenido: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(4000, "El mensaje es demasiado largo"),
});

const cambiarPrioridadSchema = z.object({
  id: z.string().trim().min(1, "ID inválido"),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]),
});

const TRANSICIONES_VALIDAS: Record<TicketEstado, TicketEstado[]> = {
  ABIERTO: ["EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"],
  EN_PROGRESO: ["RESUELTO", "CERRADO", "CANCELADO", "ABIERTO"],
  RESUELTO: ["CERRADO", "EN_PROGRESO", "ABIERTO"],
  CERRADO: ["ABIERTO"],
  CANCELADO: ["ABIERTO"],
 };

function formatFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}

function buildUrl(ticketId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/soporte/${ticketId}`;
}

async function notificar(
  ticketId: string,
  accion: TicketAccion,
  extras?: { detalle?: string; userName?: string }
) {
  try {
    const ticket = await prisma.soporteTicket.findUnique({
      where: { id: ticketId },
      select: {
        titulo: true,
        estado: true,
        prioridad: true,
        creadoPor: { select: { nombre: true } },
      },
    });
    if (!ticket) return;
    const autorNombre = ticket.creadoPor?.nombre ?? "Desconocido";
    await notifyTicket({
      ticketId,
      titulo: ticket.titulo,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      autor: autorNombre,
      accion,
      detalle: extras?.detalle ?? null,
      url: buildUrl(ticketId),
    });
  } catch (e) {
    console.error("[soporte] fallo notificando telegram:", e);
  }
}

function ensureCanModify(
  ticket: { createdById: string },
  user: { id: string; role: string }
): string | null {
  const esMio = ticket.createdById === user.id;
  if (!esMio && user.role !== "ADMIN") {
    return "No tienes permisos sobre este ticket";
  }
  return null;
}

export async function crearSoporteTicket(
  _prev: SoporteFormState,
  formData: FormData
): Promise<SoporteFormState> {
  const user = await requireAuth();

  const parsed = crearSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    prioridad: formData.get("prioridad") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: formatFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const prioridad: TicketPrioridad = data.prioridad ?? "NORMAL";

  let ticketId: string | null = null;
  try {
    ticketId = await withTransaction(async (tx) => {
      const ticket = await tx.soporteTicket.create({
        data: {
          titulo: data.titulo,
          descripcion: data.descripcion,
          prioridad,
          estado: "ABIERTO",
          createdById: user.id,
        },
      });
      await registrarActividad({
        tx,
        tipo: "SOPORTE_CREADO",
        entidad: "SOPORTE",
        entidadId: ticket.id,
        userId: user.id,
        context: `Prioridad ${prioridad}`,
        soporteTicketId: ticket.id,
      });
      return ticket.id;
    });
  } catch {
    return { error: "No se pudo crear el ticket" };
  }

  revalidatePath("/soporte");
  revalidatePath("/dashboard");

  if (ticketId) {
    await notificar(ticketId, "creado", {
      userName: user.name,
    });
    redirect(`/soporte/${ticketId}`);
  }
  return { error: "No se pudo crear el ticket" };
}

export async function cambiarEstadoSoporteTicket(
  _prev: SoporteAccionState,
  formData: FormData
): Promise<SoporteAccionState> {
  const user = await requireAdmin();

  const parsed = cambiarEstadoSchema.safeParse({
    id: formData.get("id"),
    estado: formData.get("estado"),
  });
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const { id, estado: nuevoEstado } = parsed.data;

  const ticket = await prisma.soporteTicket.findUnique({
    where: { id },
    select: { id: true, estado: true, createdById: true },
  });
  if (!ticket) return { error: "Ticket no encontrado" };

  const permitidas = TRANSICIONES_VALIDAS[ticket.estado] ?? [];
  if (!permitidas.includes(nuevoEstado)) {
    return {
      error: `Transición inválida: ${ticket.estado} → ${nuevoEstado}`,
    };
  }

  const data: {
    estado: TicketEstado;
    resolvedAt?: Date | null;
    cerradoPorId?: string | null;
  } = { estado: nuevoEstado };

  if (nuevoEstado === "RESUELTO") data.resolvedAt = new Date();
  if (nuevoEstado === "CERRADO") {
    data.cerradoPorId = user.id;
  }

  const accion: TicketAccion =
    nuevoEstado === "EN_PROGRESO"
      ? "en_progreso"
      : nuevoEstado === "RESUELTO"
      ? "resuelto"
      : nuevoEstado === "CERRADO"
      ? "cerrado"
      : nuevoEstado === "CANCELADO"
      ? "cancelado"
      : "creado";

  const tipoActividad =
    nuevoEstado === "EN_PROGRESO"
      ? "SOPORTE_EN_PROGRESO"
      : nuevoEstado === "RESUELTO"
      ? "SOPORTE_RESUELTO"
      : nuevoEstado === "CERRADO"
      ? "SOPORTE_CERRADO"
      : nuevoEstado === "CANCELADO"
      ? "SOPORTE_CANCELADO"
      : "SOPORTE_CREADO";

  try {
    await withTransaction(async (tx) => {
      await tx.soporteTicket.update({ where: { id }, data });
      await registrarActividad({
        tx,
        tipo: tipoActividad,
        entidad: "SOPORTE",
        entidadId: id,
        userId: user.id,
        context: `${ticket.estado} → ${nuevoEstado}`,
        soporteTicketId: id,
      });
    });
  } catch {
    return { error: "No se pudo cambiar el estado" };
  }

  revalidatePath("/soporte");
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/dashboard");
  await notificar(id, accion, {
    userName: user.name,
    detalle: `${ticket.estado} → ${nuevoEstado}`,
  });
  return { ok: true };
}

export async function agregarMensajeSoporte(
  _prev: SoporteAccionState,
  formData: FormData
): Promise<SoporteAccionState> {
  const user = await requireAuth();

  const parsed = mensajeSchema.safeParse({
    id: formData.get("id"),
    contenido: formData.get("contenido"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { id, contenido } = parsed.data;

  const ticket = await prisma.soporteTicket.findUnique({
    where: { id },
    select: { id: true, estado: true, createdById: true },
  });
  if (!ticket) return { error: "Ticket no encontrado" };

  const deny = ensureCanModify(ticket, user);
  if (deny) return { error: deny };

  if (
    (ticket.estado === "RESUELTO" || ticket.estado === "CERRADO") &&
    user.role !== "ADMIN"
  ) {
    return {
      error: "Este ticket está cerrado y no admite más mensajes",
    };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.soporteMensaje.create({
        data: {
          ticketId: id,
          authorId: user.id,
          contenido,
        },
      });
      await registrarActividad({
        tx,
        tipo: "SOPORTE_COMENTADO",
        entidad: "SOPORTE",
        entidadId: id,
        userId: user.id,
        context: contenido.length > 80 ? `${contenido.slice(0, 77)}...` : contenido,
        soporteTicketId: id,
      });
    });
  } catch {
    return { error: "No se pudo agregar el mensaje" };
  }

  revalidatePath(`/soporte/${id}`);
  await notificar(id, "comentado", {
    userName: user.name,
    detalle: contenido,
  });
  return { ok: true };
}

export async function cambiarPrioridadSoporteTicket(
  _prev: SoporteAccionState,
  formData: FormData
): Promise<SoporteAccionState> {
  const user = await requireAuth();

  const parsed = cambiarPrioridadSchema.safeParse({
    id: formData.get("id"),
    prioridad: formData.get("prioridad"),
  });
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const { id, prioridad } = parsed.data;

  const ticket = await prisma.soporteTicket.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      prioridad: true,
      estado: true,
    },
  });
  if (!ticket) return { error: "Ticket no encontrado" };

  const deny = ensureCanModify(ticket, user);
  if (deny) return { error: deny };

  if (ticket.prioridad === prioridad) {
    return { ok: true };
  }

  const anterior = ticket.prioridad;

  try {
    await withTransaction(async (tx) => {
      await tx.soporteTicket.update({
        where: { id },
        data: { prioridad },
      });
      await registrarActividad({
        tx,
        tipo: "SOPORTE_PRIORIDAD",
        entidad: "SOPORTE",
        entidadId: id,
        userId: user.id,
        context: `Prioridad ${anterior} → ${prioridad}`,
        soporteTicketId: id,
      });
    });
  } catch {
    return { error: "No se pudo cambiar la prioridad" };
  }

  revalidatePath("/soporte");
  revalidatePath(`/soporte/${id}`);
  revalidatePath("/dashboard");
  await notificar(id, "creado", {
    userName: user.name,
    detalle: `Prioridad ${anterior} → ${prioridad}`,
  });
  return { ok: true };
}
