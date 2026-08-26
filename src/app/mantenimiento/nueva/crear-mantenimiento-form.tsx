"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  crearTareaMantenimiento,
  type CrearMantenimientoState,
} from "../actions";

export function CrearMantenimientoForm({
  inmuebles,
}: {
  inmuebles: { id: string; noInm: string; direccion: string | null }[];
}) {
  const router = useRouter();
  const [inmuebleId, setInmuebleId] = useState("");
  const [contacto, setContacto] = useState<"" | "ARRENDATARIO" | "PROPIETARIO">("");

  const [state, formAction, pending] = useActionState<
    CrearMantenimientoState,
    FormData
  >(crearTareaMantenimiento, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Tarea de mantenimiento creada");
      router.push("/mantenimiento");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.ok, state.error, router]);

  const showContacto = inmuebleId !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              placeholder="Resumen breve de la tarea"
              disabled={pending}
            />
            {state.fieldErrors?.titulo && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.titulo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Nota / descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Detalla la nota que verá el equipo de mantenimiento"
              rows={6}
              disabled={pending}
            />
            {state.fieldErrors?.descripcion && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.descripcion}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="inmueble">Inmueble (opcional)</Label>
            <Select
              value={inmuebleId}
              onValueChange={(v) => {
                setInmuebleId(v === "" ? "" : (v as string));
                if (v === "") setContacto("");
              }}
            >
              <SelectTrigger id="inmueble" className="w-full">
                <SelectValue placeholder="Tarea general (sin inmueble)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin inmueble</SelectItem>
                {inmuebles.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.noInm} — {i.direccion ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="inmuebleId" value={inmuebleId} />
            {state.fieldErrors?.inmuebleId && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.inmuebleId}
              </p>
            )}
          </div>

          {showContacto && (
            <div className="flex flex-col gap-2">
              <Label>¿A quién debe contactar?</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contacto"
                    value="ARRENDATARIO"
                    checked={contacto === "ARRENDATARIO"}
                    onChange={() => setContacto("ARRENDATARIO")}
                    disabled={pending}
                    className="size-4 accent-primary"
                  />
                  Arrendatario
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="contacto"
                    value="PROPIETARIO"
                    checked={contacto === "PROPIETARIO"}
                    onChange={() => setContacto("PROPIETARIO")}
                    disabled={pending}
                    className="size-4 accent-primary"
                  />
                  Propietario
                </label>
              </div>
              {state.fieldErrors?.contacto && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.contacto}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="fechaLimite">Fecha límite (opcional)</Label>
            <Input
              id="fechaLimite"
              name="fechaLimite"
              type="date"
              disabled={pending}
            />
            {state.fieldErrors?.fechaLimite && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.fechaLimite}
              </p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/mantenimiento")}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner className="mr-2" />}
              {pending ? "Creando..." : "Crear tarea"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}