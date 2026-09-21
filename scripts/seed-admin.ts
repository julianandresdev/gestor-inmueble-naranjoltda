import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  if (!password) {
    console.error(
      "Falta variable: se requiere ADMIN_PASSWORD en .env o .env.local."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL ni POSTGRES_URL están definidas.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

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
        nombre,
      },
    });
    console.log(`El usuario "${username}" ya existía. Se actualizó su contraseña y estado a ACTIVO.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre,
      username,
      passwordHash,
      rol: "ADMIN",
      estado: "ACTIVO",
    },
  });

  console.log(`Administrador "${username}" creado correctamente.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});