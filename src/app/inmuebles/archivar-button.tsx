"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { archivarInmueble } from "./actions";

export function ArchivarInmuebleButton({
  inmuebleId,
  noInm,
  disabled,
}: {
  inmuebleId: string;
  noInm: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!confirm(`¿Archivar el inmueble ${noInm}?`)) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", inmuebleId);
      const res = await archivarInmueble({}, fd);
      if (res.ok) {
        toast.success(`Inmueble ${noInm} archivado`);
        router.push("/inmuebles");
      } else {
        setError(res.error ?? "No se pudo archivar el inmueble");
        toast.error(res.error ?? "No se pudo archivar el inmueble");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={pending || disabled}
        onClick={handleSubmit}
      >
        {pending && <Spinner className="mr-2" />}
        {pending ? "Archivando..." : "Archivar"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
