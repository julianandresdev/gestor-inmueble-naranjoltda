"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { crearUsuario, editarUsuario, type UserFormState } from "./actions";
import type { SafeUser } from "@/lib/dal";
import { useRouter } from "next/navigation";

type Mode = "crear" | "editar";

function UsuarioForm({
  mode,
  usuario,
  rolBloqueado,
  onSuccess,
}: {
  mode: Mode;
  usuario?: SafeUser;
  rolBloqueado?: boolean;
  onSuccess: () => void;
}) {
  const action = mode === "crear" ? crearUsuario : editarUsuario;
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    action,
    {}
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (state.ok) {
      toast.success(mode === "crear" ? "Usuario creado" : "Usuario actualizado");
      onSuccess();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.ok, state.error, mode, onSuccess]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      {mode === "editar" && usuario && (
        <input type="hidden" name="id" value={usuario.id} />
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={usuario?.nombre ?? ""}
          disabled={pending}
        />
        {state.fieldErrors?.nombre && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.nombre}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          name="username"
          defaultValue={usuario?.username ?? ""}
          disabled={pending}
        />
        {state.fieldErrors?.username && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.username}
          </p>
        )}
      </div>

      {mode === "crear" && (
        <>
          <PasswordField
            id="password"
            name="password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 8 caracteres"
            disabled={pending}
            error={state.fieldErrors?.password}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repite la contraseña"
            disabled={pending}
            error={
              state.fieldErrors?.confirmPassword ??
              (passwordsMismatch ? "Las contraseñas no coinciden" : undefined)
            }
          />
        </>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="rol">Rol</Label>
        <Select
          name="rol"
          defaultValue={usuario?.rol ?? "ASESOR"}
          disabled={rolBloqueado}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASESOR">Asesor</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
          </SelectContent>
        </Select>
        {state.fieldErrors?.rol && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.rol}
          </p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <DialogFooter>
        <Button
          type="submit"
          disabled={pending || (mode === "crear" && passwordsMismatch)}
        >
          {pending && <Spinner className="mr-2" />}
          {pending
            ? mode === "crear"
              ? "Creando..."
              : "Guardando..."
            : mode === "crear"
              ? "Crear"
              : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UsuarioFormDialog({
  mode,
  usuario,
  rolBloqueado,
  trigger,
}: {
  mode: Mode;
  usuario?: SafeUser;
  rolBloqueado?: boolean;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);

  const handleSuccess = () => {
    setOpen(false);
    setInstance((n) => n + 1);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "crear" ? "Nuevo usuario" : "Editar usuario"}
          </DialogTitle>
          <DialogDescription>
            {mode === "crear"
              ? "Crea un asesor o administrador."
              : "Edita nombre, usuario y rol."}
          </DialogDescription>
        </DialogHeader>

        <UsuarioForm
          key={`${instance}-${usuario?.id ?? "new"}-${usuario?.updatedAt.toISOString() ?? ""}`}
          mode={mode}
          usuario={usuario}
          rolBloqueado={rolBloqueado}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}