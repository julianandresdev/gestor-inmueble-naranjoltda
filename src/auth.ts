import "server-only";
import NextAuth, { AuthError, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRateLimitKey,
  checkLock,
  clearFailures,
  getClientIp,
  recordFailure,
} from "@/lib/rate-limit";
import type { Rol, Estado } from "@/generated/prisma/client";

const credentialsSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  logger: {
    error: (error) => {
      if (error instanceof AuthError && error.type === "CredentialsSignin") {
        return;
      }

      console.error("[auth][error]", error);
    },
  },
  providers: [
    Credentials({
      name: "credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials, request) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const headers =
          request instanceof Request
            ? request.headers
            : new Headers();
        const ip = getClientIp(headers);
        const key = buildRateLimitKey(ip, username);

        const lock = checkLock(key);
        if (lock.locked) {
          console.warn("[auth] login blocked", {
            username,
            ip,
            retryAfterSec: lock.retryAfterSec,
          });
          return null;
        }

        const user = await prisma.usuario.findUnique({
          where: { username },
          select: {
            id: true,
            nombre: true,
            username: true,
            passwordHash: true,
            rol: true,
            estado: true,
            sessionVersion: true,
          },
        });

        if (!user) {
          recordFailure(key);
          console.warn("[auth] login failed", {
            username,
            ip,
            reason: "user_not_found",
          });
          return null;
        }
        if (user.estado !== "ACTIVO" satisfies Estado) {
          recordFailure(key);
          console.warn("[auth] login failed", {
            username,
            ip,
            reason: "inactive",
          });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          recordFailure(key);
          console.warn("[auth] login failed", {
            username,
            ip,
            reason: "bad_password",
          });
          return null;
        }

        clearFailures(key);
        return {
          id: user.id,
          name: user.nombre,
          email: user.username,
          role: user.rol as Rol,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Rol }).role;
        token.sessionVersion = (
          user as { sessionVersion: number }
        ).sessionVersion;
        return token;
      }

      if (typeof token.id === "string") {
        const current = await prisma.usuario.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });

        if (
          !current ||
          current.sessionVersion !== (token.sessionVersion as number)
        ) {
          return null;
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as Rol,
          name: token.name as string,
          username: token.email as string,
        };
      }
      return session;
    },
    authorized: ({ auth, request }) => {
      const path = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;

      if (path === "/login") {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.url));
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", request.url));
      }

      if (path.startsWith("/administracion") && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", request.url));
      }

      if (path === "/inicio") {
        return Response.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
  },
};

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
