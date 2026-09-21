import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";

export class InmutableAuditError extends Error {
  constructor(model: string, action: string) {
    super(
      `Operación denegada: el modelo ${model} es estrictamente inmutable (append-only) y no permite la acción '${action}'.`
    );
    this.name = "InmutableAuditError";
  }
}

export const retentionContext = new AsyncLocalStorage<{ allowPurge: boolean }>();

export async function runWithRetentionPurge<T>(fn: () => Promise<T>): Promise<T> {
  return retentionContext.run({ allowPurge: true }, fn);
}

const inmutableModels = new Set([
  "actividad",
  "Actividad",
  "registroAcceso",
  "RegistroAcceso",
]);

const blockedOperations = new Set([
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

function getBaseClient(): PrismaClient {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV === "test"
      ? "postgresql://test:test@localhost:5432/test"
      : "");
  if (!connectionString) {
    throw new Error(
      "No se encontró la variable de conexión a la base de datos (POSTGRES_URL o DATABASE_URL). Configúrala en tu entorno o archivo .env"
    );
  }
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 4 : 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function createPrismaClient() {
  const baseClient = getBaseClient();
  return baseClient.$extends({
    name: "inmutable-audit-protection",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            model &&
            inmutableModels.has(model) &&
            blockedOperations.has(operation)
          ) {
            const isRetention = retentionContext.getStore()?.allowPurge === true;
            if (!isRetention) {
              throw new InmutableAuditError(model, operation);
            }
          }
          return (query as (args: unknown) => Promise<unknown>)(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

export type TransactionClient = Parameters<Parameters<ExtendedPrismaClient["$transaction"]>[0]>[0];

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as ExtendedPrismaClient;
globalForPrisma.prisma = prisma;