-- CreateEnum
CREATE TYPE "Destinacion" AS ENUM ('VIVIENDA', 'COMERCIO');

-- CreateEnum
CREATE TYPE "InmuebleEstado" AS ENUM ('ACTIVO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "inmuebles" (
    "id" TEXT NOT NULL,
    "noInm" TEXT NOT NULL,
    "barrio" TEXT,
    "ciudad" TEXT,
    "tipoInmueble" TEXT,
    "destinacion" "Destinacion",
    "direccion" TEXT,
    "docArrendatario" TEXT,
    "arrendatario" TEXT,
    "celArre1" TEXT,
    "emailArre" TEXT,
    "docPropietario" TEXT,
    "propietario" TEXT,
    "emailPro" TEXT,
    "celPro1" TEXT,
    "vigenciaContrato" TEXT,
    "nomAdmin" TEXT,
    "observaciones" TEXT,
    "estado" "InmuebleEstado" NOT NULL DEFAULT 'ACTIVO',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inmuebles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inmuebles_noInm_key" ON "inmuebles"("noInm");

-- CreateIndex
CREATE INDEX "inmuebles_ciudad_idx" ON "inmuebles"("ciudad");

-- CreateIndex
CREATE INDEX "inmuebles_barrio_idx" ON "inmuebles"("barrio");

-- CreateIndex
CREATE INDEX "inmuebles_tipoInmueble_idx" ON "inmuebles"("tipoInmueble");

-- CreateIndex
CREATE INDEX "inmuebles_destinacion_idx" ON "inmuebles"("destinacion");

-- CreateIndex
CREATE INDEX "inmuebles_estado_idx" ON "inmuebles"("estado");

-- AddForeignKey
ALTER TABLE "inmuebles" ADD CONSTRAINT "inmuebles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inmuebles" ADD CONSTRAINT "inmuebles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
