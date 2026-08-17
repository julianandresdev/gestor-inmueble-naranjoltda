import Link from "next/link";
import { notFound } from "next/navigation";
import { getTarea, requireAuth } from "@/lib/dal";
import { listarActividadTarea } from "@/lib/audit";
import { ESTADO_LABEL, esVencida } from "@/lib/tarea-utils";
import { TareaAcciones } from "../tarea-acciones";
import { ActividadTimeline } from "@/components/actividad-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Detalle({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const [tarea, actividad] = await Promise.all([
    getTarea(id),
    listarActividadTarea(id),
  ]);
  if (!tarea) notFound();

  const vencida = esVencida(tarea);
  const soyResponsable = tarea.asignadaA?.id === user.id;
  const soyAdmin = user.role === "ADMIN";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tarea.titulo}
            </h1>
            <Badge>{ESTADO_LABEL[tarea.estado]}</Badge>
            {tarea.importante && <Badge>Importante</Badge>}
            {tarea.urgente && <Badge variant="destructive">Urgente</Badge>}
            {vencida && <Badge variant="outline">Vencida</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Creada por {tarea.creadoPor.nombre} el{" "}
            {tarea.createdAt.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/tareas" />}
          >
            Volver
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Descripción
              </dt>
              <dd className="whitespace-pre-wrap text-sm">
                {tarea.descripcion || "—"}
              </dd>
            </div>
            <Detalle
              label="Inmueble"
              value={
                tarea.inmueble ? (
                  <Link
                    href={`/inmuebles/${tarea.inmueble.id}`}
                    className="font-mono hover:underline"
                  >
                    {tarea.inmueble.noInm}
                  </Link>
                ) : null
              }
            />
            <Detalle label="Fecha límite" value={
              tarea.fechaLimite ? (
                <span className={vencida ? "text-destructive" : ""}>
                  {tarea.fechaLimite.toLocaleString()}
                </span>
              ) : null
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detalle label="Creador" value={tarea.creadoPor.nombre} />
            <Detalle
              label="Responsable"
              value={tarea.asignadaA?.nombre ?? "Sin asignar"}
            />
            <Detalle label="Creada" value={tarea.createdAt.toLocaleString()} />
            <Detalle
              label="Completada"
              value={tarea.completedAt?.toLocaleString() ?? null}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <TareaAcciones
            tareaId={tarea.id}
            estado={tarea.estado}
            soyResponsable={soyResponsable}
            soyAdmin={soyAdmin}
          />
        </CardContent>
      </Card>

      <ActividadTimeline items={actividad} />
    </main>
  );
}