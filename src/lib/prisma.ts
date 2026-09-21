import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
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
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV === "test"
      ? "postgresql://test:test@localhost:5432/test"
      : "");
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configúrala en tu archivo .env"
    );
  }
  const adapter = new PrismaPg({ connectionString });
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