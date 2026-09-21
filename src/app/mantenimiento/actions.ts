"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { getClientInfoSafe } from "@/lib/client-info";
import { esVencida } from "@/lib/tarea-utils";
import { isAllowedTaskDueDate, TASK_DUE_DATE_ERROR } from "@/lib/task-date";

const crearSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "El título es obligatorio")
      .max(200, "El título es demasiado largo"),
    descripcion: z.string().trim().max(4000).optional().nullable(),
    inmuebleId: z.string().trim().min(1).optional().nullable(),
    contacto: z.enum(["ARRENDATARIO", "PROPIETARIO"]).optional().nullable(),
    fechaLimite: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || isAllowedTaskDueDate(v),
        TASK_DUE_DATE_ERROR
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      data.inmuebleId == null ||
      data.inmuebleId === "" ||
      data.contacto != null,
    {
      message:
        "Selecciona a quién debe contactar (arrendatario o propietario) cuando hay inmueble",
      path: ["contacto"],
    }
  );

export type CrearMantenimientoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
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

export async function crearTareaMantenimiento(
  _prev: CrearMantenimientoState,
  formData: FormData
): Promise<CrearMantenimientoState> {
  const user = await requirePermission("MANTENIMIENTO_CREATE");

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcionRaw = String(formData.get("descripcion") ?? "").trim();
  const descripcion = descripcionRaw === "" ? null : descripcionRaw;
  const rawInmuebleId = String(formData.get("inmuebleId") ?? "").trim();
  const inmuebleId = rawInmuebleId === "" ? null : rawInmuebleId;
  const rawContacto = String(formData.get("contacto") ?? "").trim();
  const contacto =
    rawContacto === "" || rawContacto === "ninguno" ? null : rawContacto;
  const rawFecha = String(formData.get("fechaLimite") ?? "").trim();
  const fechaLimite = rawFecha === "" ? null : rawFecha;

  if (inmuebleId && !contacto) {
    return {
      error: "Revisa los campos",
      fieldErrors: {
        contacto:
          "Selecciona a quién debe contactar (arrendatario o propietario) cuando hay inmueble",
      },
    };
  }

  const parsed = crearSchema.safeParse({
    titulo,
    descripcion,
    inmuebleId,
    contacto,
    fechaLimite,
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: formatFieldErrors(parsed.error),
    };
  }

  const fecha = parsed.data.fechaLimite
    ? new Date(parsed.data.fechaLimite)
    : null;

  let tareaId: string | null = null;
  const clientInfo = await getClientInfoSafe();
  try {
    tareaId = await withTransaction(async (tx) => {
      const tarea = await tx.tarea.create({
        data: {
          titulo: parsed.data.titulo,
          descripcion: parsed.data.descripcion ?? null,
          inmuebleId: parsed.data.inmuebleId ?? null,
          fechaLimite: fecha,
          estado: "SIN_ASIGNAR",
          tipo: "MANTENIMIENTO",
          contacto: parsed.data.contacto ?? null,
          createdById: user.id,
          assignedToId: null,
        },
      });
      await registrarActividad({
        tx,
        tipo: "MANTENIMIENTO_TAREA_CREADA",
        entidad: "TAREA",
        entidadId: tarea.id,
        userId: user.id,
        context: parsed.data.titulo,
        tareaId: tarea.id,
        inmuebleId: tarea.inmuebleId,
        ip: clientInfo?.ip,
        dispositivo: clientInfo?.resumenDispositivo,
      });
      return tarea.id;
    });
  } catch {
    return { error: "No se pudo crear la tarea de mantenimiento" };
  }

  revalidatePath("/mantenimiento");
  revalidatePath("/dashboard");
  if (tareaId) redirect(`/mantenimiento/${tareaId}`);
  return { error: "No se pudo crear la tarea de mantenimiento" };
}

export type MantenimientoAccionState = {
  error?: string;
  ok?: boolean;
};

export async function reclamarTareaMantenimiento(
  _prev: MantenimientoAccionState,
  formData: FormData
): Promise<MantenimientoAccionState> {
  const user = await requirePermission("MANTENIMIENTO_EXECUTE");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const clientInfo = await getClientInfoSafe();
  try {
    await withTransaction(async (tx) => {
      const result = await tx.tarea.updateMany({
        where: { id, tipo: "MANTENIMIENTO", estado: "SIN_ASIGNAR" },
        data: { estado: "EN_PROGRESO", assignedToId: user.id },
      });
      if (result.count === 0) {
        throw new Error("CONFLICT");
      }
      await registrarActividad({
        tx,
        tipo: "MANTENIMIENTO_TAREA_RECLAMADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: user.name,
        tareaId: id,
        cambios: {
          estado: { antes: "SIN_ASIGNAR", despues: "EN_PROGRESO" },
        },
        ip: clientInfo?.ip,
        dispositivo: clientInfo?.resumenDispositivo,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return { error: "La tarea ya fue reclamada por otro usuario" };
    }
    return { error: "No se pudo reclamar la tarea" };
  }

  revalidatePath("/mantenimiento");
  revalidatePath(`/mantenimiento/${id}`);
  return { ok: true };
}

export async function finalizarTareaMantenimiento(
  _prev: MantenimientoAccionState,
  formData: FormData
): Promise<MantenimientoAccionState> {
  const user = await requirePermission("MANTENIMIENTO_EXECUTE");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const previa = await prisma.tarea.findUnique({
    where: { id },
    select: { assignedToId: true, estado: true, tipo: true },
  });
  if (!previa) return { error: "Tarea no encontrada" };
  if (previa.tipo !== "MANTENIMIENTO") {
    return { error: "Esta tarea no es de mantenimiento" };
  }
  if (previa.estado !== "EN_PROGRESO") {
    return { error: "Solo se puede finalizar una tarea en progreso" };
  }
  if (user.role !== "ADMIN" && previa.assignedToId !== user.id) {
    return { error: "No tienes permisos para finalizar esta tarea" };
  }

  const clientInfo = await getClientInfoSafe();
  try {
    await withTransaction(async (tx) => {
      const result = await tx.tarea.updateMany({
        where: {
          id,
          tipo: "MANTENIMIENTO",
          estado: "EN_PROGRESO",
          assignedToId: user.role === "ADMIN" ? previa.assignedToId : user.id,
        },
        data: { estado: "COMPLETADA", completedAt: new Date() },
      });
      if (result.count === 0) {
        throw new Error("CONFLICT");
      }
      await registrarActividad({
        tx,
        tipo: "MANTENIMIENTO_TAREA_FINALIZADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: null,
        tareaId: id,
        cambios: {
          estado: { antes: "EN_PROGRESO", despues: "COMPLETADA" },
        },
        ip: clientInfo?.ip,
        dispositivo: clientInfo?.resumenDispositivo,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return { error: "No se pudo finalizar: el estado cambió" };
    }
    return { error: "No se pudo finalizar la tarea" };
  }

  revalidatePath("/mantenimiento");
  revalidatePath(`/mantenimiento/${id}`);
  return { ok: true };
}

export async function desreclamarTareaMantenimiento(
  _prev: MantenimientoAccionState,
  formData: FormData
): Promise<MantenimientoAccionState> {
  const user = await requirePermission("MANTENIMIENTO_EXECUTE");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const previa = await prisma.tarea.findUnique({
    where: { id },
    select: { assignedToId: true, estado: true, tipo: true },
  });
  if (!previa) return { error: "Tarea no encontrada" };
  if (previa.tipo !== "MANTENIMIENTO") {
    return { error: "Esta tarea no es de mantenimiento" };
  }
  if (previa.estado !== "EN_PROGRESO") {
    return { error: "Solo se puede desreclamar una tarea en progreso" };
  }
  if (user.role !== "ADMIN" && previa.assignedToId !== user.id) {
    return { error: "No tienes permisos para desreclamar esta tarea" };
  }

  const clientInfo = await getClientInfoSafe();
  try {
    await withTransaction(async (tx) => {
      const result = await tx.tarea.updateMany({
        where: {
          id,
          tipo: "MANTENIMIENTO",
          estado: "EN_PROGRESO",
          assignedToId: user.role === "ADMIN" ? previa.assignedToId : user.id,
        },
        data: { estado: "SIN_ASIGNAR", assignedToId: null },
      });
      if (result.count === 0) {
        throw new Error("CONFLICT");
      }
      await registrarActividad({
        tx,
        tipo: "MANTENIMIENTO_TAREA_LIBERADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: null,
        tareaId: id,
        cambios: {
          estado: { antes: "EN_PROGRESO", despues: "SIN_ASIGNAR" },
        },
        ip: clientInfo?.ip,
        dispositivo: clientInfo?.resumenDispositivo,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return { error: "No se pudo desreclamar: el estado cambió" };
    }
    return { error: "No se pudo desreclamar la tarea" };
  }

  revalidatePath("/mantenimiento");
  revalidatePath(`/mantenimiento/${id}`);
  return { ok: true };
}

export { esVencida };
