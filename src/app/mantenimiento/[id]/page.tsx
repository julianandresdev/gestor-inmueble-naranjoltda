import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCurrentUser,
  getMantenimientoTarea,
} from "@/lib/dal";
import { listarActividadTarea } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/format";
import { ActividadTimeline } from "@/components/actividad-timeline";
import { MantenimientoAcciones } from "../tarea-acciones";
import type { TareaEstado } from "@/generated/prisma/client";

const ESTADO_LABEL: Record<TareaEstado, string> = {
  SIN_ASIGNAR: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Finalizada",
  CANCELADA: "Cancelada",
  ARCHIVADA: "Archivada",
};

export default async function MantenimientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) notFound();

  const { id } = await params;
  const tarea = await getMantenimientoTarea(id);
  if (!tarea) notFound();

  const isAdminOrAsesor =
    session.role === "ADMIN" || session.role === "ASESOR";

  const actividad = isAdminOrAsesor ? await listarActividadTarea(id) : [];

  const assignedToId = tarea.asignadaA?.id ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tarea.titulo}
            </h1>
            <Badge
              variant={
                tarea.estado === "EN_PROGRESO"
                  ? "default"
                  : tarea.estado === "SIN_ASIGNAR"
                  ? "secondary"
                  : tarea.estado === "COMPLETADA"
                  ? "outline"
                  : "destructive"
              }
            >
              {ESTADO_LABEL[tarea.estado]}
            </Badge>
          </div>
          {tarea.fechaLimite && (
            <p className="text-sm text-muted-foreground">
              Fecha límite: {formatDate(tarea.fechaLimite)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/mantenimiento" />}>
            Volver
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inmueble</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {tarea.inmueble ? (
              <>
                <Link
                  href={`/inmuebles/${tarea.inmueble.id}`}
                  className="font-mono text-sm hover:underline"
                >
                  {tarea.inmueble.noInm}
                </Link>
                {tarea.inmueble.direccion && (
                  <p className="text-sm text-muted-foreground">
                    {tarea.inmueble.direccion}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin inmueble</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
            <CardDescription>
              {tarea.contacto
                ? tarea.contacto === "ARRENDATARIO"
                  ? "Arrendatario"
                  : "Propietario"
                : "Sin preferencia"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {tarea.inmueble?.nombreContacto ? (
              <>
                <p className="text-sm font-medium">
                  {tarea.inmueble.nombreContacto}
                </p>
                {tarea.inmueble.telefonoContacto && (
                  <p className="text-sm text-muted-foreground">
                    {tarea.inmueble.telefonoContacto}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nota</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">
            {tarea.descripcion ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Creado por
            </dt>
            <dd className="text-sm">{tarea.creadoPor.nombre}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Creado el
            </dt>
            <dd className="text-sm">{formatDateTime(tarea.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Asignado a
            </dt>
            <dd className="text-sm">
              {tarea.asignadaA ? tarea.asignadaA.nombre : "—"}
            </dd>
          </div>
        </CardContent>
      </Card>

      {!isAdminOrAsesor && (
        <MantenimientoAcciones
          tareaId={tarea.id}
          estado={tarea.estado}
          assignedToId={assignedToId}
          currentUserId={session.id}
          currentUserRole={session.role}
        />
      )}
      {isAdminOrAsesor && (
        <MantenimientoAcciones
          tareaId={tarea.id}
          estado={tarea.estado}
          assignedToId={assignedToId}
          currentUserId={session.id}
          currentUserRole={session.role}
        />
      )}

      {isAdminOrAsesor && <ActividadTimeline items={actividad} />}
    </main>
  );
}