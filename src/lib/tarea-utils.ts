import type { TareaEstado } from "@/generated/prisma/client";

export const ESTADO_LABEL: Record<TareaEstado, string> = {
  SIN_ASIGNAR: "Sin asignar",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  ARCHIVADA: "Archivada",
};

export function esVencida(tarea: {
  estado: TareaEstado;
  fechaLimite: Date | null;
}): boolean {
  if (!tarea.fechaLimite) return false;
  if (tarea.estado === "COMPLETADA" || tarea.estado === "CANCELADA") {
    return false;
  }
  return tarea.fechaLimite.getTime() < Date.now();
}