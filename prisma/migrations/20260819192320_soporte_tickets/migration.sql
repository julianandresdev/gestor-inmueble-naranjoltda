-- CreateEnum
CREATE TYPE "TicketPrioridad" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TicketEstado" AS ENUM ('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO', 'CANCELADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_CREADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_ASIGNADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_EN_PROGRESO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_RESUELTO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_CERRADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_CANCELADO';
ALTER TYPE "ActividadTipo" ADD VALUE 'SOPORTE_COMENTADO';

-- AlterEnum
ALTER TYPE "EntidadTipo" ADD VALUE 'SOPORTE';

-- AlterTable
ALTER TABLE "actividad" ADD COLUMN     "soporteTicketId" TEXT;

-- CreateTable
CREATE TABLE "soporte_tickets" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" "TicketPrioridad" NOT NULL DEFAULT 'NORMAL',
    "estado" "TicketEstado" NOT NULL DEFAULT 'ABIERTO',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "cerradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soporte_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soporte_mensajes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soporte_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "soporte_tickets_estado_idx" ON "soporte_tickets"("estado");

-- CreateIndex
CREATE INDEX "soporte_tickets_assignedToId_idx" ON "soporte_tickets"("assignedToId");

-- CreateIndex
CREATE INDEX "soporte_tickets_createdById_idx" ON "soporte_tickets"("createdById");

-- CreateIndex
CREATE INDEX "soporte_tickets_createdAt_idx" ON "soporte_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "soporte_mensajes_ticketId_idx" ON "soporte_mensajes"("ticketId");

-- CreateIndex
CREATE INDEX "actividad_soporteTicketId_idx" ON "actividad"("soporteTicketId");

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_soporteTicketId_fkey" FOREIGN KEY ("soporteTicketId") REFERENCES "soporte_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soporte_tickets" ADD CONSTRAINT "soporte_tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soporte_tickets" ADD CONSTRAINT "soporte_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soporte_tickets" ADD CONSTRAINT "soporte_tickets_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soporte_mensajes" ADD CONSTRAINT "soporte_mensajes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "soporte_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soporte_mensajes" ADD CONSTRAINT "soporte_mensajes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
