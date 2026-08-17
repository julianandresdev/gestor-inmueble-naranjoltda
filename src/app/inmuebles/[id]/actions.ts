"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { z } from "zod";

const notaSchema = z.object({
  contenido: z
    .string()
    .trim()
    .min(1, "El contenido de la nota es obligatorio")
    .max(5000, "La nota es demasiado larga"),
});

export type NotaFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export async function crearNota(
  inmuebleId: string,
  _prev: NotaFormState,
  formData: FormData
): Promise<NotaFormState> {
  const user = await requireAuth();

  const parsed = notaSchema.safeParse({
    contenido: formData.get("contenido"),
  });

  if (!parsed.success) {
    return {
      error: "Revisa el contenido",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [
          k,
          (v as string[] | undefined)?.[0] ?? "",
        ])
      ),
    };
  }

  const inmueble = await prisma.inmueble.findUnique({
    where: { id: inmuebleId },
    select: { id: true, estado: true, noInm: true },
  });
  if (!inmueble) return { error: "Inmueble no encontrado" };
  if (inmueble.estado !== "ACTIVO") {
    return { error: "No se pueden añadir notas a un inmueble archivado" };
  }

  try {
    await withTransaction(async (tx) => {
      const nota = await tx.nota.create({
        data: {
          contenido: parsed.data.contenido,
          inmuebleId,
          authorId: user.id,
        },
      });
      await registrarActividad({
        tx,
        tipo: "NOTA_CREADA",
        entidad: "NOTA",
        entidadId: nota.id,
        userId: user.id,
        context: `No. Inm ${inmueble.noInm}`,
        inmuebleId,
      });
    });
  } catch {
    return { error: "No se pudo guardar la nota" };
  }

  revalidatePath(`/inmuebles/${inmuebleId}`);
  return { ok: true };
}
