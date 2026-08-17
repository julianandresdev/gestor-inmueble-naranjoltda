"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { cambiarEstadoUsuario, type UserFormState } from "./actions";
import type { SafeUser } from "@/lib/dal";

function CambiarEstadoForm({
  usuario,
  onSuccess,
}: {
  usuario: SafeUser;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    cambiarEstadoUsuario,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(
        usuario.estado === "ACTIVO"
          ? `Usuario ${usuario.nombre} desactivado`
          : `Usuario ${usuario.nombre} activado`
      );
      onSuccess();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.ok, state.error, usuario.nombre, usuario.estado, onSuccess]);

  const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  const label = usuario.estado === "ACTIVO" ? "Desactivar" : "Activar";
  const loadingLabel = usuario.estado === "ACTIVO" ? "Desactivando..." : "Activando...";

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={usuario.id} />
      <input type="hidden" name="estado" value={nuevoEstado} />
      <Button
        type="submit"
        size="sm"
        variant={usuario.estado === "ACTIVO" ? "outline" : "default"}
        disabled={pending}
      >
        {pending && <Spinner className="mr-2" />}
        {pending ? loadingLabel : label}
      </Button>
    </form>
  );
}

export function CambiarEstadoButton({
  usuario,
  esSelf,
}: {
  usuario: SafeUser;
  esSelf?: boolean;
}) {
  const router = useRouter();
  const [instance, setInstance] = useState(0);

  const handleSuccess = () => {
    setInstance((n) => n + 1);
    router.refresh();
  };

  if (esSelf && usuario.estado === "ACTIVO") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        title="No puedes desactivar tu propia cuenta"
      >
        Desactivar
      </Button>
    );
  }

  return (
    <CambiarEstadoForm
      key={`${instance}-${usuario.id}-${usuario.estado}`}
      usuario={usuario}
      onSuccess={handleSuccess}
    />
  );
}
