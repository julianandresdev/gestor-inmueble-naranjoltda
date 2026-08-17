"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearNota, type NotaFormState } from "./actions";

const schema = z.object({
  contenido: z
    .string()
    .trim()
    .min(1, "El contenido de la nota es obligatorio")
    .max(5000, "La nota es demasiado larga"),
});

type FormValues = z.infer<typeof schema>;

export function NuevaNotaForm({ inmuebleId }: { inmuebleId: string }) {
  const router = useRouter();
  const [state, setState] = useState<NotaFormState>({});
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contenido: "" },
  });

  const onSubmit = (data: FormValues) => {
    const fd = new FormData();
    fd.set("contenido", data.contenido);
    startTransition(async () => {
      const res = await crearNota(inmuebleId, {}, fd);
      setState(res);
      if (res.ok) {
        reset();
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contenido">Nueva nota</Label>
        <Textarea
          id="contenido"
          placeholder="Escribe una nota de seguimiento..."
          disabled={pending}
          {...register("contenido")}
        />
        {errors.contenido && (
          <p className="text-sm text-destructive">{errors.contenido.message}</p>
        )}
        {state.error && !errors.contenido && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="mr-2" />}
          {pending ? "Guardando..." : "Añadir nota"}
        </Button>
      </div>
    </form>
  );
}