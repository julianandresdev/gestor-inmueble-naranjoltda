-- CreateEnum
CREATE TYPE "ActividadTipo" AS ENUM ('INMUEBLE_CREADO', 'INMUEBLE_EDITADO', 'INMUEBLE_ARCHIVADO', 'INMUEBLE_RESTAURADO', 'NOTA_CREADA', 'TAREA_CREADA', 'TAREA_RECLAMADA', 'TAREA_LIBERADA', 'TAREA_COMPLETADA');

-- CreateEnum
CREATE TYPE "EntidadTipo" AS ENUM ('INMUEBLE', 'NOTA', 'TAREA');

-- CreateTable
CREATE TABLE "actividad" (
    "id" TEXT NOT NULL,
    "tipo" "ActividadTipo" NOT NULL,
    "entidad" "EntidadTipo" NOT NULL,
    "entidadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT,
    "inmuebleId" TEXT,
    "tareaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actividad_entidad_entidadId_idx" ON "actividad"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "actividad_inmuebleId_idx" ON "actividad"("inmuebleId");

-- CreateIndex
CREATE INDEX "actividad_tareaId_idx" ON "actividad"("tareaId");

-- CreateIndex
CREATE INDEX "actividad_createdAt_idx" ON "actividad"("createdAt");

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "inmuebles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECK constraints de consistencia para tareas
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_sin_asignar_sin_responsable" CHECK (estado <> 'SIN_ASIGNAR' OR "assignedToId" IS NULL);
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_en_progreso_con_responsable" CHECK (estado <> 'EN_PROGRESO' OR "assignedToId" IS NOT NULL);
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_completada_con_completedAt" CHECK (estado <> 'COMPLETADA' OR "completedAt" IS NOT NULL);
