import type { TicketEstado, TicketPrioridad } from "@/generated/prisma/client";

export const TICKET_ESTADO_LABEL: Record<TicketEstado, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
};

export const TICKET_PRIORIDAD_LABEL: Record<TicketPrioridad, string> = {
  BAJA: "Baja",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const TICKET_ESTADO_VARIANT: Record<
  TicketEstado,
  "default" | "secondary" | "outline" | "destructive"
> = {
  ABIERTO: "secondary",
  EN_PROGRESO: "default",
  RESUELTO: "outline",
  CERRADO: "outline",
  CANCELADO: "destructive",
};

export const TICKET_PRIORIDAD_VARIANT: Record<
  TicketPrioridad,
  "default" | "secondary" | "outline" | "destructive"
> = {
  BAJA: "outline",
  NORMAL: "secondary",
  ALTA: "default",
  URGENTE: "destructive",
};
