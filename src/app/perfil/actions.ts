"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { z } from "zod";
import { requireAuth } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";

const cambiarMiContrasenaSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CambiarMiContrasenaState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export async function cambiarMiContrasena(
  _prev: CambiarMiContrasenaState,
  formData: FormData
): Promise<CambiarMiContrasenaState> {
  const user = await requireAuth();

  const parsed = cambiarMiContrasenaSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(
          ([k, v]) => [k, (v as string[] | undefined)?.[0] ?? ""]
        )
      ),
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await withTransaction(async (tx) => {
    await tx.usuario.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await registrarActividad({
      tx,
      tipo: "USUARIO_PASSWORD_CAMBIADO",
      entidad: "USUARIO",
      entidadId: user.id,
      userId: user.id,
      context: "Contraseña actualizada por el propio usuario",
    });
  });

  revalidatePath("/perfil");

  await signOut({ redirectTo: "/login" });
  redirect("/login");
}