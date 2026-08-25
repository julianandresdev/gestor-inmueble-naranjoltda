"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { z } from "zod";

const camposBase = {
  noInm: z
    .string()
    .trim()
    .min(1, "El No. Inm es obligatorio")
    .max(60, "No. Inm demasiado largo"),
  barrio: z.string().trim().max(120).optional().nullable(),
  ciudad: z.string().trim().max(120).optional().nullable(),
  tipoInmueble: z.string().trim().max(80).optional().nullable(),
  destinacion: z.enum(["VIVIENDA", "COMERCIO"]).optional().nullable(),
  direccion: z.string().trim().max(240).optional().nullable(),
  docArrendatario: z.string().trim().max(60).optional().nullable(),
  arrendatario: z.string().trim().max(180).optional().nullable(),
  celArre1: z.string().trim().max(40).optional().nullable(),
  emailArre: z
    .preprocess(
      (v) => {
        if (typeof v !== "string") return v;
        const t = v.trim();
        return t === "" ? null : t.toLowerCase();
      },
      z.union([
        z
          .string()
          .max(160)
          .pipe(z.email("Email de arrendatario inválido")),
        z.null(),
      ])
    )
    .optional()
    .nullable(),
  docPropietario: z.string().trim().max(60).optional().nullable(),
  propietario: z.string().trim().max(180).optional().nullable(),
  emailPro: z
    .preprocess(
      (v) => {
        if (typeof v !== "string") return v;
        const t = v.trim();
        return t === "" ? null : t.toLowerCase();
      },
      z.union([
        z
          .string()
          .max(160)
          .pipe(z.email("Email de propietario inválido")),
        z.null(),
      ])
    )
    .optional()
    .nullable(),
  celPro1: z.string().trim().max(40).optional().nullable(),
  vigenciaContrato: z.string().trim().max(80).optional().nullable(),
  nomAdmin: z.string().trim().max(180).optional().nullable(),
  observaciones: z.string().trim().max(2000).optional().nullable(),
};

const createSchema = z.object(camposBase);
const updateSchema = z.object({
  ...camposBase,
  noInm: z.never().optional(),
});

export type InmuebleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function toStrings(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(camposBase)) {
    const value = formData.get(key);
    if (typeof value === "string") {
      const trimmed = value.trim();
      out[key] = trimmed === "" ? null : trimmed;
    } else {
      out[key] = null;
    }
  }
  return out;
}

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "P2002"
  );
}

export async function crearInmueble(
  _prev: InmuebleFormState,
  formData: FormData
): Promise<InmuebleFormState> {
  const user = await requireAuth();

  const parsed = createSchema.safeParse(toStrings(formData));

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: formatFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  if (!data.noInm) {
    return { error: "El No. Inm es obligatorio" };
  }

  let inmuebleId: string | null = null;
  try {
    inmuebleId = await withTransaction(async (tx) => {
      const inmueble = await tx.inmueble.create({
        data: {
          ...data,
          createdById: user.id,
          updatedById: user.id,
        },
      });
      await registrarActividad({
        tx,
        tipo: "INMUEBLE_CREADO",
        entidad: "INMUEBLE",
        entidadId: inmueble.id,
        userId: user.id,
        context: `No. Inm ${inmueble.noInm}`,
        inmuebleId: inmueble.id,
      });
      return inmueble.id;
    });
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        error: "Ya existe un inmueble con ese No. Inm",
        fieldErrors: { noInm: "No. Inm en uso" },
      };
    }
    return { error: "No se pudo crear el inmueble" };
  }

  revalidatePath("/inmuebles");
  revalidatePath("/dashboard");
  if (inmuebleId) redirect(`/inmuebles/${inmuebleId}`);
  return { error: "No se pudo crear el inmueble" };
}

export async function editarInmueble(
  id: string,
  _prev: InmuebleFormState,
  formData: FormData
): Promise<InmuebleFormState> {
  const user = await requireAuth();

  const existente = await prisma.inmueble.findUnique({
    where: { id },
    select: { id: true, estado: true, noInm: true },
  });
  if (!existente) return { error: "Inmueble no encontrado" };
  if (existente.estado !== "ACTIVO") {
    return { error: "No se puede editar un inmueble archivado" };
  }

  const input = toStrings(formData);
  delete input.noInm;
  const parsed = updateSchema.omit({ noInm: true }).safeParse(input);

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: formatFieldErrors(parsed.error),
    };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.inmueble.update({
        where: { id },
        data: {
          ...parsed.data,
          updatedById: user.id,
        },
      });
      await registrarActividad({
        tx,
        tipo: "INMUEBLE_EDITADO",
        entidad: "INMUEBLE",
        entidadId: id,
        userId: user.id,
        context: `No. Inm ${existente.noInm}`,
        inmuebleId: id,
      });
    });
  } catch {
    return { error: "No se pudo actualizar el inmueble" };
  }

  revalidatePath(`/inmuebles/${id}`);
  revalidatePath("/dashboard");
  redirect(`/inmuebles/${id}`);
}

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

export type ArchivarState = {
  error?: string;
  ok?: boolean;
};

export async function archivarInmueble(
  _prev: ArchivarState,
  formData: FormData
): Promise<ArchivarState> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const existente = await prisma.inmueble.findUnique({
    where: { id },
    select: { id: true, estado: true, noInm: true },
  });
  if (!existente) return { error: "Inmueble no encontrado" };
  if (existente.estado !== "ACTIVO") {
    return { error: "El inmueble ya está archivado" };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.inmueble.update({
        where: { id },
        data: { estado: "ARCHIVADO", updatedById: user.id },
      });
      await registrarActividad({
        tx,
        tipo: "INMUEBLE_ARCHIVADO",
        entidad: "INMUEBLE",
        entidadId: id,
        userId: user.id,
        context: `No. Inm ${existente.noInm}`,
        inmuebleId: id,
      });
    });
  } catch {
    return { error: "No se pudo archivar el inmueble" };
  }

  revalidatePath("/inmuebles");
  revalidatePath("/administracion/archivados");
  revalidatePath("/dashboard");
  revalidatePath(`/inmuebles/${id}`);
  return { ok: true };
}

export async function restaurarInmueble(
  _prev: ArchivarState,
  formData: FormData
): Promise<ArchivarState> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const existente = await prisma.inmueble.findUnique({
    where: { id },
    select: { id: true, estado: true, noInm: true },
  });
  if (!existente) return { error: "Inmueble no encontrado" };
  if (existente.estado !== "ARCHIVADO") {
    return { error: "El inmueble no está archivado" };
  }

  try {
    await withTransaction(async (tx) => {
      await tx.inmueble.update({
        where: { id },
        data: { estado: "ACTIVO", updatedById: user.id },
      });
      await registrarActividad({
        tx,
        tipo: "INMUEBLE_RESTAURADO",
        entidad: "INMUEBLE",
        entidadId: id,
        userId: user.id,
        context: `No. Inm ${existente.noInm}`,
        inmuebleId: id,
      });
    });
  } catch {
    return { error: "No se pudo restaurar el inmueble" };
  }

  revalidatePath("/inmuebles");
  revalidatePath("/administracion/archivados");
  revalidatePath("/dashboard");
  revalidatePath(`/inmuebles/${id}`);
  return { ok: true };
}
