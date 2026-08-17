"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";
import type { Inmueble } from "@/generated/prisma/client";

export const inmuebleSchema = z.object({
  noInm: z
    .string()
    .trim()
    .min(1, "El No. Inm es obligatorio")
    .max(60, "Demasiado largo"),
  barrio: z.string().trim().max(120).optional(),
  ciudad: z.string().trim().max(120).optional(),
  tipoInmueble: z.string().trim().max(80).optional(),
  destinacion: z.enum(["VIVIENDA", "COMERCIO"]).optional(),
  direccion: z.string().trim().max(240).optional(),
  docArrendatario: z.string().trim().max(60).optional(),
  arrendatario: z.string().trim().max(180).optional(),
  celArre1: z.string().trim().max(40).optional(),
  emailArre: z.string().trim().max(160).optional(),
  docPropietario: z.string().trim().max(60).optional(),
  propietario: z.string().trim().max(180).optional(),
  emailPro: z.string().trim().max(160).optional(),
  celPro1: z.string().trim().max(40).optional(),
  vigenciaContrato: z.string().trim().max(80).optional(),
  nomAdmin: z.string().trim().max(180).optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export type InmuebleFormValues = z.infer<typeof inmuebleSchema>;

function Field({
  name,
  label,
  register,
  error,
  disabled,
  type,
  ...rest
}: {
  name: string;
  label: string;
  register: ReturnType<typeof useForm<InmuebleFormValues>>["register"];
  error?: string;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} disabled={disabled} {...register(name as keyof InmuebleFormValues)} {...rest} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function InmuebleForm({
  mode,
  inmueble,
  action,
}: {
  mode: "crear" | "editar";
  inmueble?: Inmueble;
  action: (formData: FormData) => void;
}) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InmuebleFormValues>({
    resolver: zodResolver(inmuebleSchema),
    defaultValues: inmueble
      ? {
          noInm: inmueble.noInm,
          barrio: inmueble.barrio ?? "",
          ciudad: inmueble.ciudad ?? "",
          tipoInmueble: inmueble.tipoInmueble ?? "",
          destinacion: inmueble.destinacion ?? undefined,
          direccion: inmueble.direccion ?? "",
          docArrendatario: inmueble.docArrendatario ?? "",
          arrendatario: inmueble.arrendatario ?? "",
          celArre1: inmueble.celArre1 ?? "",
          emailArre: inmueble.emailArre ?? "",
          docPropietario: inmueble.docPropietario ?? "",
          propietario: inmueble.propietario ?? "",
          emailPro: inmueble.emailPro ?? "",
          celPro1: inmueble.celPro1 ?? "",
          vigenciaContrato: inmueble.vigenciaContrato ?? "",
          nomAdmin: inmueble.nomAdmin ?? "",
          observaciones: inmueble.observaciones ?? "",
        }
      : {
          noInm: "",
          destinacion: undefined,
        },
  });

  const destinacion = watch("destinacion");

  const onSubmit = (data: InmuebleFormValues) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null) continue;
      fd.set(k, String(v));
    }
    if (mode === "editar" && inmueble) {
      fd.set("noInm", inmueble.noInm);
    }
    startTransition(() => {
      action(fd);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            name="noInm"
            label="No. Inm *"
            register={register}
            error={errors.noInm?.message}
            disabled={mode === "editar" || pending}
          />
          <Field
            name="direccion"
            label="Dirección"
            register={register}
            error={errors.direccion?.message}
            disabled={pending}
          />
          <Field
            name="barrio"
            label="Barrio"
            register={register}
            error={errors.barrio?.message}
            disabled={pending}
          />
          <Field
            name="ciudad"
            label="Ciudad"
            register={register}
            error={errors.ciudad?.message}
            disabled={pending}
          />
          <Field
            name="tipoInmueble"
            label="Tipo de inmueble"
            register={register}
            error={errors.tipoInmueble?.message}
            disabled={pending}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="destinacion">Destinación</Label>
            <Select
              value={destinacion ?? ""}
              onValueChange={(v) =>
                setValue("destinacion", v === "" ? undefined : (v as "VIVIENDA" | "COMERCIO"))
              }
            >
              <SelectTrigger id="destinacion" className="w-full">
                <SelectValue placeholder="Sin destinación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin destinación</SelectItem>
                <SelectItem value="VIVIENDA">Vivienda</SelectItem>
                <SelectItem value="COMERCIO">Comercio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field
            name="vigenciaContrato"
            label="Vigencia contrato"
            register={register}
            error={errors.vigenciaContrato?.message}
            disabled={pending}
          />
          <Field
            name="nomAdmin"
            label="Administración"
            register={register}
            error={errors.nomAdmin?.message}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
          <Field
            name="arrendatario"
            label="Arrendatario"
            register={register}
            error={errors.arrendatario?.message}
            disabled={pending}
          />
          <Field
            name="docArrendatario"
            label="Doc. arrendatario"
            register={register}
            error={errors.docArrendatario?.message}
            disabled={pending}
          />
          <Field
            name="celArre1"
            label="Teléfono arrendatario"
            register={register}
            error={errors.celArre1?.message}
            disabled={pending}
          />
          <Field
            name="emailArre"
            label="Email arrendatario"
            register={register}
            error={errors.emailArre?.message}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2">
          <Field
            name="propietario"
            label="Propietario"
            register={register}
            error={errors.propietario?.message}
            disabled={pending}
          />
          <Field
            name="docPropietario"
            label="Doc. propietario"
            register={register}
            error={errors.docPropietario?.message}
            disabled={pending}
          />
          <Field
            name="celPro1"
            label="Teléfono propietario"
            register={register}
            error={errors.celPro1?.message}
            disabled={pending}
          />
          <Field
            name="emailPro"
            label="Email propietario"
            register={register}
            error={errors.emailPro?.message}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              disabled={pending}
              {...register("observaciones")}
            />
            {errors.observaciones && (
              <p className="text-sm text-destructive">
                {errors.observaciones.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="mr-2" />}
          {pending
            ? mode === "crear"
              ? "Creando..."
              : "Actualizando..."
            : mode === "crear"
              ? "Crear inmueble"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}