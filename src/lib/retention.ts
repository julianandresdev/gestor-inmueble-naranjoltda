import "server-only";
import { prisma, runWithRetentionPurge } from "@/lib/prisma";

export const DEFAULT_RETENTION_MONTHS = 12;

export function getRetentionMonths(): number {
  const envVal = process.env.AUDIT_RETENTION_MONTHS;
  if (!envVal) return DEFAULT_RETENTION_MONTHS;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RETENTION_MONTHS;
}

export type RetentionResult = {
  ok: boolean;
  retentionMonths: number;
  presenciaEliminada: number;
  actividadEliminada: number;
  accesosEliminados: number;
  fechaLimiteAuditoria: string;
  fechaLimitePresencia: string;
};

const BATCH_SIZE = 500;

export async function ejecutarPurgaRetencion(): Promise<RetentionResult> {
  const months = getRetentionMonths();
  const fechaLimiteAuditoria = new Date();
  fechaLimiteAuditoria.setMonth(fechaLimiteAuditoria.getMonth() - months);

  // Sesiones de presencia sin actividad hace más de 24 horas
  const fechaLimitePresencia = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Limpieza de presencia (tabla no auditada, deleteMany normal)
  const { count: presenciaEliminada } = await prisma.sesionPresencia.deleteMany({
    where: { ultimaActividad: { lt: fechaLimitePresencia } },
  });

  // 2. Limpieza de actividad vencida por lotes con bypass de inmutabilidad
  let actividadEliminada = 0;
  while (true) {
    const batch = await prisma.actividad.findMany({
      where: { createdAt: { lt: fechaLimiteAuditoria } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (batch.length === 0) break;

    const ids = batch.map((r) => r.id);
    await runWithRetentionPurge(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL app.allow_retention_purge = 'true';");
        await tx.actividad.deleteMany({
          where: { id: { in: ids } },
        });
      });
    });

    actividadEliminada += ids.length;
    if (ids.length < BATCH_SIZE) break;
  }

  // 3. Limpieza de registro de accesos vencidos por lotes con bypass de inmutabilidad
  let accesosEliminados = 0;
  while (true) {
    const batch = await prisma.registroAcceso.findMany({
      where: { createdAt: { lt: fechaLimiteAuditoria } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (batch.length === 0) break;

    const ids = batch.map((r) => r.id);
    await runWithRetentionPurge(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL app.allow_retention_purge = 'true';");
        await tx.registroAcceso.deleteMany({
          where: { id: { in: ids } },
        });
      });
    });

    accesosEliminados += ids.length;
    if (ids.length < BATCH_SIZE) break;
  }

  return {
    ok: true,
    retentionMonths: months,
    presenciaEliminada,
    actividadEliminada,
    accesosEliminados,
    fechaLimiteAuditoria: fechaLimiteAuditoria.toISOString(),
    fechaLimitePresencia: fechaLimitePresencia.toISOString(),
  };
}
