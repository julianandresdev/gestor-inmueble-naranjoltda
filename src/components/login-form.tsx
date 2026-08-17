"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login, type LoginState } from "@/app/actions";

const schema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: state.username ?? "" },
  });

  const onSubmit = (data: FormValues) => {
    const formData = new FormData();
    formData.set("username", data.username);
    formData.set("password", data.password);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              autoComplete="username"
              disabled={pending}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={pending}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="mt-2">
            {pending && <Spinner className="mr-2" />}
            {pending ? "Iniciando sesión..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}