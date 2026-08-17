"use client";

import { useActionState } from "react";
import { InmuebleForm } from "../../inmueble-form";
import { editarInmueble, type InmuebleFormState } from "../../actions";
import type { Inmueble } from "@/generated/prisma/client";

export function EditarInmuebleForm({ inmueble }: { inmueble: Inmueble }) {
  const [state, formAction] = useActionState<InmuebleFormState, FormData>(
    (prev, fd) => editarInmueble(inmueble.id, prev, fd),
    {}
  );

  return (
    <div className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <InmuebleForm mode="editar" inmueble={inmueble} action={formAction} />
    </div>
  );
}