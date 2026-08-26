"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { PasswordField } from "@/components/password-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  adminCambiarContrasenaUsuario,
  type CambiarContrasenaState,
} from "./actions";

export function CambiarContrasenaDialog({
  usuarioId,
  usuarioNombre,
  trigger,
}: {
  usuarioId: string;
  usuarioNombre: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {`Establece una nueva contraseña para ${usuarioNombre}. Su sesión actual será invalidada.`}
          </DialogDescription>
        </DialogHeader>

        <CambiarContrasenaForm
          key={`${instance}-${usuarioId}`}
          usuarioId={usuarioId}
          onSuccess={() => {
            setOpen(false);
            setInstance((n) => n + 1);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function CambiarContrasenaForm({
  usuarioId,
  onSuccess,
}: {
  usuarioId: string;
  onSuccess: () => void;
}) {
  const action = adminCambiarContrasenaUsuario;
  const [state, formAction, pending] = useActionState<
    CambiarContrasenaState,
    FormData
  >(action, {});

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (state.ok) {
      toast.success("Contraseña actualizada");
      onSuccess();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.ok, state.error, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={usuarioId} />

      <PasswordField
        id="newPassword"
        name="newPassword"
        label="Nueva contraseña"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="Mínimo 8 caracteres"
        disabled={pending}
        error={state.fieldErrors?.newPassword}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Repite la contraseña"
        disabled={pending}
        error={
          state.fieldErrors?.confirmPassword ??
          (passwordsMismatch ? "Las contraseñas no coinciden" : undefined)
        }
      />

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <DialogFooter>
        <Button
          type="submit"
          disabled={pending || passwordsMismatch}
        >
          {pending && <Spinner className="mr-2" />}
          {pending ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </DialogFooter>
    </form>
  );
}