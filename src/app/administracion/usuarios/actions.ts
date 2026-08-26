"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { registrarActividad, withTransaction } from "@/lib/audit";
import { z } from "zod";

const baseFields = {
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(40, "El usuario es demasiado largo")
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, '.', '_' y '-'"),
};

const createSchema = z
  .object({
    ...baseFields,
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    rol: z.enum(["ADMIN", "ASESOR", "MANTENIMIENTO"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const updateSchema = z.object({
  ...baseFields,
  rol: z.enum(["ADMIN", "ASESOR", "MANTENIMIENTO"]),
});

const estadoSchema = z.object({
  id: z.string().min(1),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

const cambiarContrasenaSchema = z
  .object({
    id: z.string().min(1, "ID inválido"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type UserFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export type CambiarContrasenaState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "P2002"
  );
}

export async function crearUsuario(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    nombre: formData.get("nombre"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    rol: formData.get("rol"),
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

  const { password, ...data } = parsed.data;
  delete (data as Record<string, unknown>).confirmPassword;

  const existente = await prisma.usuario.findUnique({
    where: { username: data.username },
    select: { id: true },
  });
  if (existente) {
    return {
      error: "Ya existe un usuario con ese nombre de usuario",
      fieldErrors: { username: "Usuario en uso" },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.usuario.create({
      data: { ...data, passwordHash },
    });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        error: "Ya existe un usuario con ese nombre de usuario",
        fieldErrors: { username: "Usuario en uso" },
      };
    }
    return { error: "No se pudo crear el usuario" };
  }
}

export async function editarUsuario(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const current = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const parsed = updateSchema.safeParse({
    nombre: formData.get("nombre"),
    username: formData.get("username"),
    rol: formData.get("rol"),
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

  if (id === current.id && parsed.data.rol !== "ADMIN") {
    return {
      error: "No puedes cambiar tu propio rol",
      fieldErrors: { rol: "No puedes bajarte tus privilegios" },
    };
  }

  const conflictivo = await prisma.usuario.findFirst({
    where: { username: parsed.data.username, NOT: { id } },
    select: { id: true },
  });
  if (conflictivo) {
    return {
      error: "Ya existe un usuario con ese nombre de usuario",
      fieldErrors: { username: "Usuario en uso" },
    };
  }

  try {
    await prisma.usuario.update({
      where: { id },
      data: parsed.data,
    });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        error: "Ya existe un usuario con ese nombre de usuario",
        fieldErrors: { username: "Usuario en uso" },
      };
    }
    return { error: "No se pudo actualizar el usuario" };
  }
}

export async function cambiarEstadoUsuario(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const current = await requireAdmin();

  const parsed = estadoSchema.safeParse({
    id: formData.get("id"),
    estado: formData.get("estado"),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  if (parsed.data.id === current.id && parsed.data.estado === "INACTIVO") {
    return { error: "No puedes desactivar tu propia cuenta" };
  }

  await prisma.usuario.update({
    where: { id: parsed.data.id },
    data: {
      estado: parsed.data.estado,
      sessionVersion: { increment: 1 },
    },
  });

  return { ok: true };
}

export async function adminCambiarContrasenaUsuario(
  _prev: CambiarContrasenaState,
  formData: FormData
): Promise<CambiarContrasenaState> {
  const current = await requireAdmin();

  const targetId = String(formData.get("id") ?? "");
  if (!targetId) return { error: "ID inválido" };

  const target = await prisma.usuario.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, rol: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  if (target.rol === "ADMIN" && target.id !== current.id) {
    return {
      error: "No puedes cambiar la contraseña de otro administrador",
    };
  }

  const parsed = cambiarContrasenaSchema.safeParse({
    id: targetId,
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
      where: { id: targetId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await registrarActividad({
      tx,
      tipo: "USUARIO_PASSWORD_RESETEADO",
      entidad: "USUARIO",
      entidadId: targetId,
      userId: current.id,
      context: `Contraseña reseteada por admin para ${target.username}`,
    });
  });

  return { ok: true };
}