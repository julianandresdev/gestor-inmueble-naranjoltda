-- CreateEnum
CREATE TYPE "TareaEstado" AS ENUM ('SIN_ASIGNAR', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA', 'ARCHIVADA');

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "inmuebleId" TEXT,
    "fechaLimite" TIMESTAMP(3),
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "estado" "TareaEstado" NOT NULL DEFAULT 'SIN_ASIGNAR',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tareas_estado_idx" ON "tareas"("estado");

-- CreateIndex
CREATE INDEX "tareas_assignedToId_idx" ON "tareas"("assignedToId");

-- CreateIndex
CREATE INDEX "tareas_inmuebleId_idx" ON "tareas"("inmuebleId");

-- CreateIndex
CREATE INDEX "tareas_fechaLimite_idx" ON "tareas"("fechaLimite");

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
