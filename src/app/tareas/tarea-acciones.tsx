"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { reclamarTarea, liberarTarea, completarTarea } from "./actions";

type PendingKey = "reclamar" | "liberar" | "completar" | null;

export function TareaAcciones({
  tareaId,
  estado,
  soyResponsable,
  soyAdmin,
}: {
  tareaId: string;
  estado: "SIN_ASIGNAR" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA" | "ARCHIVADA";
  soyResponsable: boolean;
  soyAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<PendingKey>(null);
  const [, startTransition] = useTransition();

  function run(
    key: Exclude<PendingKey, null>,
    action: (prev: object, fd: FormData) => Promise<{ error?: string; ok?: boolean }>,
    successMsg: string,
    errorMsg: string
  ) {
    setError(null);
    setPendingKey(key);
    const fd = new FormData();
    fd.set("id", tareaId);
    startTransition(async () => {
      const res = await action({}, fd);
      setPendingKey(null);
      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
      } else {
        setError(res.error ?? errorMsg);
        toast.error(res.error ?? errorMsg);
      }
    });
  }

  const puedeReclamar = estado === "SIN_ASIGNAR";
  const puedeLiberar = estado === "EN_PROGRESO" && (soyResponsable || soyAdmin);
  const puedeCompletar = estado === "EN_PROGRESO" && (soyResponsable || soyAdmin);
  const busy = pendingKey !== null;

  return (
    <div className="flex flex-col gap-2">
      {puedeReclamar && (
        <Button
          disabled={busy}
          onClick={() =>
            run("reclamar", reclamarTarea, "Tarea reclamada", "No se pudo reclamar la tarea")
          }
        >
          {pendingKey === "reclamar" && <Spinner className="mr-2" />}
          {pendingKey === "reclamar" ? "Reclamando..." : "Reclamar tarea"}
        </Button>
      )}
      {puedeLiberar && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            run("liberar", liberarTarea, "Tarea liberada", "No se pudo liberar la tarea")
          }
        >
          {pendingKey === "liberar" && <Spinner className="mr-2" />}
          {pendingKey === "liberar" ? "Liberando..." : "Liberar tarea"}
        </Button>
      )}
      {puedeCompletar && (
        <Button
          variant="default"
          disabled={busy}
          onClick={() =>
            run("completar", completarTarea, "Tarea completada", "No se pudo completar la tarea")
          }
        >
          {pendingKey === "completar" && <Spinner className="mr-2" />}
          {pendingKey === "completar" ? "Completando..." : "Marcar completada"}
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
