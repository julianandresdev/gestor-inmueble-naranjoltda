"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  agregarMensajeSoporte,
  cambiarEstadoSoporteTicket,
  cambiarPrioridadSoporteTicket,
} from "../actions";
import type { TicketEstado, TicketPrioridad } from "@/generated/prisma/client";

const TRANSICIONES: Record<TicketEstado, TicketEstado[]> = {
  ABIERTO: ["EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"],
  EN_PROGRESO: ["RESUELTO", "CERRADO", "CANCELADO", "ABIERTO"],
  RESUELTO: ["CERRADO", "EN_PROGRESO", "ABIERTO"],
  CERRADO: ["ABIERTO"],
  CANCELADO: ["ABIERTO"],
};

type ActionResult = { error?: string; ok?: boolean };

type PendingKey = "estado" | "mensaje" | "prioridad" | null;

const PRIORIDADES: { value: TicketPrioridad; label: string }[] = [
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const ESTADOS_BLOQUEADOS: TicketEstado[] = ["RESUELTO", "CERRADO"];

export function SoporteTicketAcciones({
  ticketId,
  estado,
  prioridad,
  puedeModificar,
  esAdmin,
}: {
  ticketId: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  puedeModificar: boolean;
  esAdmin: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<PendingKey>(null);
  const [nuevoEstado, setNuevoEstado] = useState<TicketEstado | "">("");
  const [mensaje, setMensaje] = useState("");
  const [prioridadPendiente, setPrioridadPendiente] =
    useState<TicketPrioridad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const prioridadVisible = prioridadPendiente ?? prioridad;
  const prioridadCambiada =
    prioridadPendiente !== null && prioridadPendiente !== prioridad;

  function run(
    key: Exclude<PendingKey, null>,
    action: (prev: object, fd: FormData) => Promise<ActionResult>,
    successMsg: string,
    errorMsg: string,
    fd: FormData,
    onSuccess?: () => void
  ) {
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      const res = await action({}, fd);
      setPendingKey(null);
      if (res.ok) {
        toast.success(successMsg);
        if (key === "mensaje") setMensaje("");
        if (key === "estado") setNuevoEstado("");
        if (key === "prioridad") setPrioridadPendiente(null);
        onSuccess?.();
        router.refresh();
      } else {
        setError(res.error ?? errorMsg);
        toast.error(res.error ?? errorMsg);
      }
    });
  }

  const busy = pendingKey !== null;
  const transiciones = TRANSICIONES[estado] ?? [];
  const bloqueadoNoAdmin =
    !esAdmin && ESTADOS_BLOQUEADOS.includes(estado);

  return (
    <div className="flex flex-col gap-6">
      {puedeModificar && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <h3 className="text-sm font-semibold">Cambiar prioridad</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="nuevaPrioridad">Prioridad</Label>
                <Select
                  value={prioridadVisible}
                  onValueChange={(v) =>
                    setPrioridadPendiente((v as TicketPrioridad) ?? null)
                  }
                >
                  <SelectTrigger id="nuevaPrioridad" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={busy || !prioridadCambiada}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("id", ticketId);
                  fd.set("prioridad", prioridadPendiente ?? prioridad);
                  run(
                    "prioridad",
                    cambiarPrioridadSoporteTicket,
                    "Prioridad actualizada",
                    "No se pudo cambiar la prioridad",
                    fd
                  );
                }}
              >
                {pendingKey === "prioridad" && <Spinner className="mr-2" />}
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {esAdmin && transiciones.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <h3 className="text-sm font-semibold">Cambiar estado</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="nuevoEstado">Nuevo estado</Label>
                <Select
                  value={nuevoEstado}
                  onValueChange={(v) => setNuevoEstado((v as TicketEstado) ?? "")}
                >
                  <SelectTrigger id="nuevoEstado" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {transiciones.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={busy || !nuevoEstado}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("id", ticketId);
                  fd.set("estado", nuevoEstado);
                  run(
                    "estado",
                    cambiarEstadoSoporteTicket,
                    "Estado actualizado",
                    "No se pudo cambiar el estado",
                    fd
                  );
                }}
              >
                {pendingKey === "estado" && <Spinner className="mr-2" />}
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {bloqueadoNoAdmin ? (
        <Card>
          <CardContent className="flex flex-col gap-2 py-6">
            <h3 className="text-sm font-semibold">Conversación cerrada</h3>
            <p className="text-sm text-muted-foreground">
              Este ticket está en estado{" "}
              <span className="font-medium">{estado}</span> y no admite más
              mensajes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <h3 className="text-sm font-semibold">Agregar mensaje</h3>
            <Input
              placeholder="Escribe un mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                disabled={busy || mensaje.trim() === ""}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("id", ticketId);
                  fd.set("contenido", mensaje);
                  run(
                    "mensaje",
                    agregarMensajeSoporte,
                    "Mensaje agregado",
                    "No se pudo agregar el mensaje",
                    fd
                  );
                }}
              >
                {pendingKey === "mensaje" && <Spinner className="mr-2" />}
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
