import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const admin = await prisma.usuario.findFirst({ where: { username: "admin" } });
  if (!admin) throw new Error("Admin no existe");

  const data = [
    { noInm: "100", barrio: "Centro", ciudad: "Medellín", tipoInmueble: "Apartamento", destinacion: "VIVIENDA" as const, direccion: "Cra 50 #45-12", arrendatario: "Juan Pérez", docArrendatario: "12345678", celArre1: "3001112222", propietario: "María Gómez", docPropietario: "98765432", celPro1: "3109998888" },
    { noInm: "101", barrio: "Laureles", ciudad: "Medellín", tipoInmueble: "Casa", destinacion: "VIVIENDA" as const, direccion: "Calle 35 #75-30", arrendatario: "Ana Ruiz", docArrendatario: "22233344", celArre1: "3124445555", propietario: "Carlos Soto" },
    { noInm: "200", barrio: "Poblado", ciudad: "Medellín", tipoInmueble: "Local", destinacion: "COMERCIO" as const, direccion: "Av El Poblado #10-20", arrendatario: "Comercio SA", docArrendatario: "900123456", celArre1: "3205556666", propietario: "Inversiones LTDA", docPropietario: "900654321" },
    { noInm: "300", barrio: "Centro", ciudad: "Bogotá", tipoInmueble: "Oficina", destinacion: "COMERCIO" as const, direccion: "Cll 80 #15-90", arrendatario: "Carlos Soto", propietario: "María Gómez" },
  ];
  for (const d of data) {
    await prisma.inmueble.upsert({
      where: { noInm: d.noInm },
      update: { ...d, updatedById: admin.id },
      create: { ...d, createdById: admin.id, updatedById: admin.id },
    });
  }
  const count = await prisma.inmueble.count();
  console.log("Inmuebles creados:", count);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
