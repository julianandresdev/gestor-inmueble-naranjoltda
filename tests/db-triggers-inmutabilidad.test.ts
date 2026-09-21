import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Inmutabilidad Capa 3: PostgreSQL Triggers en Base de Datos Real", () => {
  let rawClient: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    try {
      const adapter = new PrismaPg({
        connectionString: (process.env.POSTGRES_URL || process.env.DATABASE_URL)!,
      });
      rawClient = new PrismaClient({ adapter });

      // Buscar o crear usuario de prueba
      const user = await rawClient.usuario.findFirst({
        where: { estado: "ACTIVO" },
        select: { id: true },
      });
      if (user) {
        testUserId = user.id;
      }
    } catch {
      // Ignorar si la BD no está disponible
    }
  });

  afterAll(async () => {
    await rawClient?.$disconnect();
  });

  it("rechaza UPDATE en la tabla actividad mediante trigger SQL", async () => {
    if (!testUserId) return;

    // Crear registro
    const act = await rawClient.actividad.create({
      data: {
        tipo: "INMUEBLE_CREADO",
        entidad: "INMUEBLE",
        entidadId: "test-inmueble-id",
        userId: testUserId,
        context: "Trigger test",
      },
    });

    // Intentar update directo vía SQL
    await expect(
      rawClient.$executeRawUnsafe(
        `UPDATE actividad SET context = 'Hackeado' WHERE id = '${act.id}'`
      )
    ).rejects.toThrow(/la tabla de auditoría actividad es estrictamente append-only/);

    // Intentar delete directo vía SQL sin bypass de retención
    await expect(
      rawClient.$executeRawUnsafe(
        `DELETE FROM actividad WHERE id = '${act.id}'`
      )
    ).rejects.toThrow(/la tabla de auditoría actividad es estrictamente append-only/);

    // Con bypass de retención autorizado dentro de una transacción, SÍ debe permitir limpiar el registro de prueba
    await rawClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL app.allow_retention_purge = 'true';");
      await tx.$executeRawUnsafe(`DELETE FROM actividad WHERE id = '${act.id}'`);
    });

    const deleted = await rawClient.actividad.findUnique({ where: { id: act.id } });
    expect(deleted).toBeNull();
  });

  it("rechaza UPDATE y DELETE en la tabla registro_accesos mediante trigger SQL", async () => {
    // Crear registro de acceso
    const acc = await rawClient.registroAcceso.create({
      data: {
        username: "test_trigger_user",
        tipo: "LOGIN_FALLIDO",
        motivo: "credenciales_invalidas",
        ip: "127.0.0.1",
      },
    });

    // Intentar update directo vía SQL
    await expect(
      rawClient.$executeRawUnsafe(
        `UPDATE registro_accesos SET motivo = 'Manipulado' WHERE id = '${acc.id}'`
      )
    ).rejects.toThrow(/la tabla de auditoría registro_accesos es estrictamente append-only/);

    // Intentar delete directo vía SQL
    await expect(
      rawClient.$executeRawUnsafe(
        `DELETE FROM registro_accesos WHERE id = '${acc.id}'`
      )
    ).rejects.toThrow(/la tabla de auditoría registro_accesos es estrictamente append-only/);

    // Con bypass de retención autorizado, SÍ permite borrar
    await rawClient.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL app.allow_retention_purge = 'true';");
      await tx.$executeRawUnsafe(`DELETE FROM registro_accesos WHERE id = '${acc.id}'`);
    });

    const deleted = await rawClient.registroAcceso.findUnique({ where: { id: acc.id } });
    expect(deleted).toBeNull();
  });
});
