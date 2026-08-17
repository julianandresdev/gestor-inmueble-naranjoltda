import Link from "next/link";
import { notFound } from "next/navigation";
import { getInmueble, requireAuth } from "@/lib/dal";
import { listarActividadInmueble } from "@/lib/audit";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotasSection } from "./notas-section";
import { ArchivarInmuebleButton } from "../archivar-button";
import { ActividadTimeline } from "@/components/actividad-timeline";

function Detalle({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function InmuebleDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user;
  await requireAuth();
  const { id } = await params;
  const [inmueble, actividad] = await Promise.all([
    getInmueble(id),
    listarActividadInmueble(id),
  ]);
  if (!inmueble) notFound();
  const isAdmin = user?.role === "ADMIN";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {inmueble.noInm}
            </h1>
            <Badge variant={inmueble.estado === "ACTIVO" ? "default" : "outline"}>
              {inmueble.estado === "ACTIVO" ? "Activo" : "Archivado"}
            </Badge>
            {inmueble.destinacion && (
              <Badge variant="secondary">
                {inmueble.destinacion === "VIVIENDA" ? "Vivienda" : "Comercio"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {inmueble.direccion ?? "Sin dirección"} · {inmueble.barrio ?? "—"} ·{" "}
            {inmueble.ciudad ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/inmuebles" />}
          >
            Volver
          </Button>
          {inmueble.estado === "ACTIVO" && (
            <Button
              nativeButton={false}
              render={<Link href={`/inmuebles/${id}/editar`} />}
            >
              Editar
            </Button>
          )}
          {inmueble.estado === "ACTIVO" && isAdmin && (
            <ArchivarInmuebleButton
              inmuebleId={inmueble.id}
              noInm={inmueble.noInm}
            />
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detalle label="No. Inm" value={inmueble.noInm} />
            <Detalle label="Tipo de inmueble" value={inmueble.tipoInmueble} />
            <Detalle label="Destinación" value={
              inmueble.destinacion
                ? inmueble.destinacion === "VIVIENDA"
                  ? "Vivienda"
                  : "Comercio"
                : null
            } />
            <Detalle label="Dirección" value={inmueble.direccion} />
            <Detalle label="Barrio" value={inmueble.barrio} />
            <Detalle label="Ciudad" value={inmueble.ciudad} />
            <Detalle label="Vigencia contrato" value={inmueble.vigenciaContrato} />
            <Detalle label="Administración" value={inmueble.nomAdmin} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Arrendatario</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Detalle label="Nombre" value={inmueble.arrendatario} />
              <Detalle label="Documento" value={inmueble.docArrendatario} />
              <Detalle label="Teléfono" value={inmueble.celArre1} />
              <Detalle label="Email" value={inmueble.emailArre} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propietario</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Detalle label="Nombre" value={inmueble.propietario} />
              <Detalle label="Documento" value={inmueble.docPropietario} />
              <Detalle label="Teléfono" value={inmueble.celPro1} />
              <Detalle label="Email" value={inmueble.emailPro} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">
            {inmueble.observaciones || "—"}
          </p>
        </CardContent>
      </Card>

      <NotasSection
        inmuebleId={inmueble.id}
        activo={inmueble.estado === "ACTIVO"}
      />

      <Card>
        <CardHeader>
          <CardTitle>Trazabilidad</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Detalle
            label="Creado por"
            value={inmueble.creadoPor?.nombre ?? "—"}
          />
          <Detalle
            label="Fecha creación"
            value={inmueble.createdAt.toLocaleString()}
          />
          <Detalle
            label="Modificado por"
            value={inmueble.modificadoPor?.nombre ?? "—"}
          />
          <Detalle
            label="Última modificación"
            value={inmueble.updatedAt.toLocaleString()}
          />
        </CardContent>
      </Card>

      <ActividadTimeline items={actividad} />
    </main>
  );
}