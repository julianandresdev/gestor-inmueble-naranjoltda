import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ni POSTGRES_URL están definidas.");
  }

  const password = process.env.ASESOR_PASSWORD;
  if (!password) {
    throw new Error("ASESOR_PASSWORD no está definida en .env o .env.local.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const username = "asesor";
    const passwordHash = await bcrypt.hash(password, 10);
    const existente = await prisma.usuario.findUnique({
      where: { username },
    });

    if (existente) {
      await prisma.usuario.update({
        where: { username },
        data: {
          passwordHash,
          estado: "ACTIVO",
        },
      });
      console.log(`El usuario "${username}" ya existía. Se actualizó su contraseña y estado a ACTIVO.`);
      return;
    }

    await prisma.usuario.create({
      data: {
        nombre: "Asesor",
        username,
        passwordHash: await bcrypt.hash(password, 10),
        rol: "ASESOR",
        estado: "ACTIVO",
      },
    });

    console.log('Asesor "asesor" creado correctamente.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
