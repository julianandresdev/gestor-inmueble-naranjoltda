-- CreateEnum
CREATE TYPE "AccesoTipo" AS ENUM ('LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActividadTipo" ADD VALUE 'USUARIO_CREADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'USUARIO_EDITADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'USUARIO_ESTADO_CAMBIADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'INMUEBLES_EXPORTADOS';
ALTER TYPE "ActividadTipo" ADD VALUE 'TAREAS_EXPORTADAS';

-- AlterTable
ALTER TABLE "actividad" ADD COLUMN     "cambios" JSONB,
ADD COLUMN     "dispositivo" TEXT,
ADD COLUMN     "ip" TEXT;

-- CreateTable
CREATE TABLE "registro_accesos" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT NOT NULL,
    "tipo" "AccesoTipo" NOT NULL,
    "motivo" TEXT,
    "ip" TEXT NOT NULL,
    "dispositivo" TEXT,
    "navegador" TEXT,
    "sistemaOperativo" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_accesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_presencia" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rutaActual" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "dispositivo" TEXT,
    "navegador" TEXT,
    "sistemaOperativo" TEXT,

    CONSTRAINT "sesiones_presencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registro_accesos_createdAt_idx" ON "registro_accesos"("createdAt");

-- CreateIndex
CREATE INDEX "registro_accesos_userId_createdAt_idx" ON "registro_accesos"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "registro_accesos_ip_createdAt_idx" ON "registro_accesos"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "registro_accesos_tipo_createdAt_idx" ON "registro_accesos"("tipo", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_presencia_sessionId_key" ON "sesiones_presencia"("sessionId");

-- CreateIndex
CREATE INDEX "sesiones_presencia_ultimaActividad_idx" ON "sesiones_presencia"("ultimaActividad");

-- CreateIndex
CREATE INDEX "sesiones_presencia_userId_idx" ON "sesiones_presencia"("userId");

-- CreateIndex
CREATE INDEX "actividad_userId_createdAt_idx" ON "actividad"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "actividad_tipo_createdAt_idx" ON "actividad"("tipo", "createdAt");

-- CreateIndex
CREATE INDEX "actividad_entidad_createdAt_idx" ON "actividad"("entidad", "createdAt");

-- AddForeignKey
ALTER TABLE "registro_accesos" ADD CONSTRAINT "registro_accesos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_presencia" ADD CONSTRAINT "sesiones_presencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Función para proteger tablas inmutables de auditoría (append-only)
CREATE OR REPLACE FUNCTION rechazar_modificacion_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir borrado únicamente si la variable de sesión está configurada por el proceso de retención
  IF (current_setting('app.allow_retention_purge', true) = 'true') THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'Operación no permitida: la tabla de auditoría % es estrictamente append-only (inmutable).', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tabla actividad
DROP TRIGGER IF EXISTS trg_proteger_inmutabilidad_actividad ON actividad;
CREATE TRIGGER trg_proteger_inmutabilidad_actividad
BEFORE UPDATE OR DELETE ON actividad
FOR EACH ROW EXECUTE FUNCTION rechazar_modificacion_auditoria();

-- Trigger para tabla registro_accesos
DROP TRIGGER IF EXISTS trg_proteger_inmutabilidad_registro_accesos ON registro_accesos;
CREATE TRIGGER trg_proteger_inmutabilidad_registro_accesos
BEFORE UPDATE OR DELETE ON registro_accesos
FOR EACH ROW EXECUTE FUNCTION rechazar_modificacion_auditoria();

