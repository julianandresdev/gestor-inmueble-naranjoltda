-- AlterEnum
-- Remove SOPORTE_ASIGNADO from ActividadTipo enum since assignment feature was removed.
ALTER TYPE "ActividadTipo" RENAME TO "ActividadTipo_old";

CREATE TYPE "ActividadTipo" AS ENUM (
  'INMUEBLE_CREADO',
  'INMUEBLE_EDITADO',
  'INMUEBLE_ARCHIVADO',
  'INMUEBLE_RESTAURADO',
  'NOTA_CREADA',
  'TAREA_CREADA',
  'TAREA_RECLAMADA',
  'TAREA_LIBERADA',
  'TAREA_COMPLETADA',
  'SOPORTE_CREADO',
  'SOPORTE_EN_PROGRESO',
  'SOPORTE_RESUELTO',
  'SOPORTE_CERRADO',
  'SOPORTE_CANCELADO',
  'SOPORTE_COMENTADO',
  'SOPORTE_PRIORIDAD'
);

ALTER TABLE "actividad"
  ALTER COLUMN "tipo" TYPE "ActividadTipo" USING ("tipo"::text::"ActividadTipo");

DROP TYPE "ActividadTipo_old";
