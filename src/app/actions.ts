"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

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
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}