"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  reclamarTareaMantenimiento,
  finalizarTareaMantenimiento,
  desreclamarTareaMantenimiento,
  type MantenimientoAccionState,
} from "./actions";
import type { TareaEstado } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export function MantenimientoAcciones({
  tareaId,
  estado,
  assignedToId,
  currentUserId,
  currentUserRole,
}: {
  tareaId: string;
  estado: TareaEstado;
  assignedToId: string | null;
  currentUserId: string;
  currentUserRole: "ADMIN" | "ASESOR" | "MANTENIMIENTO";
}) {
  const canClaim =
    estado === "SIN_ASIGNAR" &&
    (currentUserRole === "MANTENIMIENTO" ||
      currentUserRole === "ADMIN" ||
      currentUserRole === "ASESOR");
  const isAssignee = assignedToId === currentUserId;
  const canFinalize =
    estado === "EN_PROGRESO" &&
    (currentUserRole === "ADMIN" || isAssignee);
  const canRelease =
    estado === "EN_PROGRESO" &&
    (currentUserRole === "ADMIN" || isAssignee);

  if (!canClaim && !canFinalize && !canRelease) return null;

  return (
    <div className="flex justify-end gap-1">
      {canClaim && (
        <AccionButton
          tareaId={tareaId}
          action={reclamarTareaMantenimiento}
          variant="default"
          size="sm"
          label="Reclamar"
        />
      )}
      {canFinalize && (
        <AccionButton
          tareaId={tareaId}
          action={finalizarTareaMantenimiento}
          variant="outline"
          size="sm"
          label="Finalizar"
        />
      )}
      {canRelease && (
        <AccionButton
          tareaId={tareaId}
          action={desreclamarTareaMantenimiento}
          variant="ghost"
          size="sm"
          label="Desreclamar"
        />
      )}
    </div>
  );
}

function AccionButton({
  tareaId,
  action,
  variant,
  size,
  label,
}: {
  tareaId: string;
  action: (
    prev: MantenimientoAccionState,
    formData: FormData
  ) => Promise<MantenimientoAccionState>;
  variant: "default" | "outline" | "ghost";
  size: "sm";
  label: string;
}) {
  const [state, formAction, pending] = useActionState<
    MantenimientoAccionState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={tareaId} />
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending && <Spinner className="mr-2" />}
        {label}
      </Button>
    </form>
  );
}