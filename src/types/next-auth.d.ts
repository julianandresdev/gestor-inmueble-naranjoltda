import type { DefaultSession } from "next-auth";
import type { Rol } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role?: Rol;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: Rol;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Rol;
  }
}