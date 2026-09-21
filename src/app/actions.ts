"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { extractClientInfo } from "@/lib/client-info";
import { registrarAcceso, cerrarPresenciaPorUsuario } from "@/lib/audit";

export type LoginState = {
  error?: string;
  username?: string;
};

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Usuario y contraseña son obligatorios", username };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Usuario o contraseña incorrectos" };
      }
      return { error: "No se pudo iniciar sesión. Inténtalo de nuevo." };
    }
    throw error;
  }

  return {};
}

export async function logout() {
  const session = await auth();
  if (session?.user) {
    try {
      const h = await headers();
      const info = extractClientInfo(h);
      await registrarAcceso({
        userId: session.user.id,
        username: session.user.username ?? session.user.name ?? "desconocido",
        tipo: "LOGOUT",
        motivo: "cierre_voluntario",
        ip: info.ip,
        dispositivo: info.dispositivo,
        navegador: info.navegador,
        sistemaOperativo: info.sistemaOperativo,
        pais: info.pais,
        ciudad: info.ciudad,
        userAgent: info.userAgent,
      });
      await cerrarPresenciaPorUsuario(session.user.id);
    } catch (e) {
      console.error("[logout] error registrando auditoría de salida", e);
    }
  }
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}