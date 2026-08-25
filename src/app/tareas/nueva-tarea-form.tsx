"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { crearTarea } from "./actions";

const schema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "El título es demasiado largo"),
  descripcion: z.string().trim().max(4000).optional(),
  inmuebleId: z.string().optional(),
  fechaLimite: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NuevaTareaForm({
  inmuebles,
}: {
  inmuebles: { id: string; noInm: string; direccion: string | null }[];
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      inmuebleId: "",
      fechaLimite: "",
    },
  });

  const inmuebleId = useWatch({ control, name: "inmuebleId" });
  const [pending, startTransition] = useTransition();

  const onSubmit = (data: FormValues) => {
    const fd = new FormData();
    fd.set("titulo", data.titulo);
    if (data.descripcion) fd.set("descripcion", data.descripcion);
    if (data.inmuebleId) fd.set("inmuebleId", data.inmuebleId);
    if (data.fechaLimite) fd.set("fechaLimite", data.fechaLimite);

    startTransition(async () => {
      const res = await crearTarea({}, fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Tarea creada");
      router.push("/tareas");
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Título de la tarea"
              {...register("titulo")}
            />
            {errors.titulo && (
              <p className="text-sm text-destructive">
                {errors.titulo.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción opcional"
              {...register("descripcion")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inmueble">Inmueble</Label>
            <Select
              value={inmuebleId ?? ""}
              onValueChange={(v) => setValue("inmuebleId", v ?? "")}
            >
              <SelectTrigger id="inmueble" className="w-full">
                <SelectValue placeholder="Tarea general" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tarea general (sin inmueble)</SelectItem>
                {inmuebles.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.noInm} — {i.direccion ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fechaLimite">Fecha límite</Label>
            <Input
              id="fechaLimite"
              type="date"
              {...register("fechaLimite")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="importante"
              defaultChecked={false}
              className="size-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">Importante</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="urgente"
              defaultChecked={false}
              className="size-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">Urgente</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="mr-2" />}
          {pending ? "Creando..." : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}