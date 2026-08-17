import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  if (!username || !password) {
    console.error(
      "Faltan variables: se requieren ADMIN_USERNAME y ADMIN_PASSWORD."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL no está definida.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, 10);

  const existente = await prisma.usuario.findUnique({
    where: { username },
  });

  if (existente) {
    console.log(`El usuario "${username}" ya existe.`);
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