import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSoporteTicket,
  listSoporteMensajes,
  listarActividadSoporte,
  requireAuth,
} from "@/lib/dal";
import {
  TICKET_ESTADO_LABEL,
  TICKET_ESTADO_VARIANT,
  TICKET_PRIORIDAD_LABEL,
  TICKET_PRIORIDAD_VARIANT,
} from "@/lib/soporte-utils";
import { formatDateTime } from "@/lib/format";
import { ActividadTimeline } from "@/components/actividad-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SoporteTicketAcciones } from "./ticket-acciones";

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

export default async function SoporteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const [ticket, mensajesPage, actividadPage] = await Promise.all([
    getSoporteTicket(id),
    listSoporteMensajes(id),
    listarActividadSoporte(id),
  ]);
  const { items: mensajes } = mensajesPage;
  const { items: actividad } = actividadPage;

  if (!ticket) notFound();

  const esMio = ticket.creadoPor.id === user.id;
  const soyAdmin = user.role === "ADMIN";
  const puedeModificar = esMio || soyAdmin;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {ticket.titulo}
            </h1>
            <Badge variant={TICKET_ESTADO_VARIANT[ticket.estado]}>
              {TICKET_ESTADO_LABEL[ticket.estado]}
            </Badge>
            <Badge variant={TICKET_PRIORIDAD_VARIANT[ticket.prioridad]}>
              {TICKET_PRIORIDAD_LABEL[ticket.prioridad]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Creado por {ticket.creadoPor.nombre} el{" "}
            {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/soporte" />}
          >
            Volver
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Descripción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.descripcion}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Detalle label="Autor" value={ticket.creadoPor.nombre} />
            <Detalle label="Creado" value={formatDateTime(ticket.createdAt)} />
            <Detalle
              label="Resuelto"
              value={ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : null}
            />
            <Detalle
              label="Cerrado por"
              value={ticket.cerradoPor?.nombre ?? null}
            />
            <Detalle
              label="Actualizado"
              value={formatDateTime(ticket.updatedAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversación</CardTitle>
          </CardHeader>
          <CardContent>
            {mensajes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin mensajes todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {mensajes.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{m.autor.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{m.contenido}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <SoporteTicketAcciones
            ticketId={ticket.id}
            estado={ticket.estado}
            prioridad={ticket.prioridad}
            puedeModificar={puedeModificar}
            esAdmin={soyAdmin}
          />
        </CardContent>
      </Card>

      <ActividadTimeline items={actividad} />
    </main>
  );
}
