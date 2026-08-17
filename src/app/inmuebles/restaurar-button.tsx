"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { restaurarInmueble } from "./actions";

export function RestaurarInmuebleButton({
  inmuebleId,
  noInm,
}: {
  inmuebleId: string;
  noInm: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!confirm(`¿Restaurar el inmueble ${noInm}?`)) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", inmuebleId);
      const res = await restaurarInmueble({}, fd);
      if (res.ok) {
        toast.success(`Inmueble ${noInm} restaurado`);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo restaurar el inmueble");
        toast.error(res.error ?? "No se pudo restaurar el inmueble");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" disabled={pending} onClick={handleSubmit}>
        {pending && <Spinner className="mr-2" />}
        {pending ? "Restaurando..." : "Restaurar"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
