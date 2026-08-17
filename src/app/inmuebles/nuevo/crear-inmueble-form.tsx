"use client";

import { useActionState } from "react";
import { InmuebleForm } from "../inmueble-form";
import { crearInmueble, type InmuebleFormState } from "../actions";

export function CrearInmuebleForm() {
  const [state, formAction] = useActionState<InmuebleFormState, FormData>(
    crearInmueble,
    {}
  );

  return (
    <div className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <InmuebleForm mode="crear" action={formAction} />
    </div>
  );
}