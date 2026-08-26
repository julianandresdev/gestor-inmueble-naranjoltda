"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordField } from "@/components/password-input";
import { cambiarMiContrasena, type CambiarMiContrasenaState } from "./actions";

export function PerfilForm() {
  const [state, formAction, pending] = useActionState<
    CambiarMiContrasenaState,
    FormData
  >(cambiarMiContrasena, {});

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (state.ok) {
      toast.success("Contraseña actualizada. Inicia sesión de nuevo.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.ok, state.error]);

  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      router.push("/login");
    }
  }, [state.ok, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>
          Tras guardar, tu sesión actual se cerrará por seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending || passwordsMismatch}
            >
              {pending && <Spinner className="mr-2" />}
              {pending ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}