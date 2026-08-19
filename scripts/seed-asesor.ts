import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const username = "asesor";
    const existente = await prisma.usuario.findUnique({
      where: { username },
    });

    if (existente) {
      console.log(`El usuario "${username}" ya existe.`);
      return;
    }

    await prisma.usuario.create({
      data: {
        nombre: "Asesor",
        username,
        passwordHash: await bcrypt.hash("asesor123", 10),
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
