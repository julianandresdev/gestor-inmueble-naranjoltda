"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { z } from "zod";

const APP_TZ = "America/Bogota";
const MAX_YEARS_AHEAD = 5;

function todayInTZ(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function addYears(dateStr: string, years: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function isRealISODate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  );
}

const fechaLimiteSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || isRealISODate(v),
    "Fecha inválida"
  )
  .refine(
    (v) => {
      if (v === "") return true;
      const hoy = todayInTZ();
      const max = addYears(hoy, MAX_YEARS_AHEAD);
      return v >= hoy && v <= max;
    },
    `La fecha límite debe estar entre hoy y ${MAX_YEARS_AHEAD} años en el futuro`
  )
  .transform((v) => (v === "" ? null : v))
  .optional()
  .nullable();

const crearSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "El título es demasiado largo"),
  descripcion: z.string().trim().max(4000).optional().nullable(),
  inmuebleId: z.string().trim().min(1).optional().nullable(),
  fechaLimite: fechaLimiteSchema,
  importante: z
    .union([z.literal("on"), z.literal(""), z.null(), z.undefined()])
    .optional(),
  urgente: z
    .union([z.literal("on"), z.literal(""), z.null(), z.undefined()])
    .optional(),
});

export type TareaFormState = {
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

export async function crearTarea(
  _prev: TareaFormState,
  formData: FormData
): Promise<TareaFormState> {
  const user = await requireAuth();

  const fechaRaw = String(formData.get("fechaLimite") ?? "").trim();
  const parsed = crearSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    inmuebleId: formData.get("inmuebleId"),
    fechaLimite: fechaRaw === "" ? null : fechaRaw,
    importante: formData.get("importante"),
    urgente: formData.get("urgente"),
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: formatFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  if (data.inmuebleId) {
    const inm = await prisma.inmueble.findUnique({
      where: { id: data.inmuebleId },
      select: { id: true, estado: true, noInm: true },
    });
    if (!inm) return { error: "El inmueble seleccionado no existe" };
    if (inm.estado !== "ACTIVO") {
      return { error: "No se puede asociar a un inmueble archivado" };
    }
  }

  const fechaLimite = data.fechaLimite ? new Date(data.fechaLimite) : null;

  let tareaId: string | null = null;
  try {
    tareaId = await withTransaction(async (tx) => {
      const tarea = await tx.tarea.create({
        data: {
          titulo: data.titulo,
          descripcion: data.descripcion || null,
          inmuebleId: data.inmuebleId || null,
          fechaLimite,
          importante: data.importante === "on",
          urgente: data.urgente === "on",
          estado: "SIN_ASIGNAR",
          createdById: user.id,
          assignedToId: null,
        },
      });
      await registrarActividad({
        tx,
        tipo: "TAREA_CREADA",
        entidad: "TAREA",
        entidadId: tarea.id,
        userId: user.id,
        context: data.inmuebleId
          ? `Inmueble asociado`
          : "Tarea general",
        inmuebleId: data.inmuebleId || null,
        tareaId: tarea.id,
      });
      return tarea.id;
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: unknown }).code === "P2002"
    ) {
      return { error: "Conflicto al crear la tarea" };
    }
    return { error: "No se pudo crear la tarea" };
  }

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  if (tareaId) redirect(`/tareas/${tareaId}`);
  return { error: "No se pudo crear la tarea" };
}

export type TareaAccionState = {
  error?: string;
  ok?: boolean;
};

export async function reclamarTarea(
  _prev: TareaAccionState,
  formData: FormData
): Promise<TareaAccionState> {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  try {
    await withTransaction(async (tx) => {
      const result = await tx.tarea.updateMany({
        where: { id, estado: "SIN_ASIGNAR" },
        data: { estado: "EN_PROGRESO", assignedToId: user.id },
      });
      if (result.count === 0) {
        throw new Error("CONFLICT");
      }
      await registrarActividad({
        tx,
        tipo: "TAREA_RECLAMADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: null,
        tareaId: id,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return { error: "La tarea ya fue reclamada por otro usuario" };
    }
    return { error: "No se pudo reclamar la tarea" };
  }

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath(`/tareas/${id}`);
  return { ok: true };
}

export async function liberarTarea(
  _prev: TareaAccionState,
  formData: FormData
): Promise<TareaAccionState> {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  // Verificación previa de ownership/estado (feedback rápido).
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    select: { estado: true, assignedToId: true },
  });
  if (!tarea) return { error: "Tarea no encontrada" };
  if (tarea.estado !== "EN_PROGRESO") {
    return { error: "Solo se puede liberar una tarea en progreso" };
  }
  if (tarea.assignedToId !== user.id && user.role !== "ADMIN") {
    return { error: "No tienes permisos para liberar esta tarea" };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.tarea.update({
        where: { id },
        data: { estado: "SIN_ASIGNAR", assignedToId: null },
      });
      await registrarActividad({
        tx,
        tipo: "TAREA_LIBERADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: null,
        tareaId: id,
      });
    });
  } catch {
    return { error: "No se pudo liberar la tarea" };
  }

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath(`/tareas/${id}`);
  return { ok: true };
}

export async function completarTarea(
  _prev: TareaAccionState,
  formData: FormData
): Promise<TareaAccionState> {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  // Verificación previa de ownership/estado (feedback rápido).
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    select: { estado: true, assignedToId: true },
  });
  if (!tarea) return { error: "Tarea no encontrada" };
  if (tarea.estado !== "EN_PROGRESO") {
    return { error: "Solo se puede completar una tarea en progreso" };
  }
  if (tarea.assignedToId !== user.id && user.role !== "ADMIN") {
    return { error: "No tienes permisos para completar esta tarea" };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.tarea.update({
        where: { id },
        data: { estado: "COMPLETADA", completedAt: new Date() },
      });
      await registrarActividad({
        tx,
        tipo: "TAREA_COMPLETADA",
        entidad: "TAREA",
        entidadId: id,
        userId: user.id,
        context: null,
        tareaId: id,
      });
    });
  } catch {
    return { error: "No se pudo completar la tarea" };
  }

  revalidatePath("/tareas");
  revalidatePath("/dashboard");
  revalidatePath(`/tareas/${id}`);
  return { ok: true };
}
