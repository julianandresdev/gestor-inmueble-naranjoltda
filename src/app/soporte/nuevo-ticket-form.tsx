"use client";

import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { crearSoporteTicket } from "./actions";

const schema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "El título es demasiado largo"),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(8000, "La descripción es demasiado larga"),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export function NuevoTicketForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "NORMAL",
    },
  });

  const prioridad = watch("prioridad");
  const [pending, startTransition] = useTransition();

  const onSubmit = (data: FormValues) => {
    const fd = new FormData();
    fd.set("titulo", data.titulo);
    fd.set("descripcion", data.descripcion);
    if (data.prioridad) fd.set("prioridad", data.prioridad);

    startTransition(async () => {
      const res = await crearSoporteTicket({}, fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Ticket creado");
      router.push("/soporte");
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Resumen breve del problema"
              {...register("titulo")}
            />
            {errors.titulo && (
              <p className="text-sm text-destructive">{errors.titulo.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              placeholder="Detalla el problema, qué esperabas y qué ocurrió..."
              rows={8}
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Select
              value={prioridad ?? "NORMAL"}
              onValueChange={(v) =>
                setValue(
                  "prioridad",
                  (v as FormValues["prioridad"]) ?? "NORMAL"
                )
              }
            >
              <SelectTrigger id="prioridad" className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAJA">Baja</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="mr-2" />}
          {pending ? "Creando..." : "Crear ticket"}
        </Button>
      </div>
    </form>
  );
}
