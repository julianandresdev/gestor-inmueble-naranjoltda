import Link from "next/link";
import { listSoporteTickets, getSoporteKpis, requireAuth } from "@/lib/dal";
import { SoporteFiltros } from "./filtros";
import {
  TICKET_ESTADO_LABEL,
  TICKET_ESTADO_VARIANT,
  TICKET_PRIORIDAD_LABEL,
  TICKET_PRIORIDAD_VARIANT,
} from "@/lib/soporte-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { TicketEstado, TicketPrioridad } from "@/generated/prisma/client";

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const filtros = {
    q: get("q"),
    estado: (get("estado") as TicketEstado | undefined) ?? undefined,
    prioridad: (get("prioridad") as TicketPrioridad | undefined) ?? undefined,
  };

  const [ticketsPage, kpis] = await Promise.all([
    listSoporteTickets(filtros),
    getSoporteKpis(),
  ]);
  const { items: tickets } = ticketsPage;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Soporte</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "ADMIN"
              ? "Todos los tickets de soporte del equipo."
              : "Tickets de soporte que has creado."}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/soporte/nuevo" />}>
          Nuevo ticket
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abiertos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{kpis.soporteAbiertos}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{kpis.soporteEnProgreso}</span>
          </CardContent>
        </Card>
      </div>

      <SoporteFiltros />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="w-1 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay tickets que coincidan.
                </TableCell>
              </TableRow>
            )}
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-64">
                  <span className="line-clamp-2 font-medium">{t.titulo}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.mensajesCount} mensaje{t.mensajesCount === 1 ? "" : "s"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={TICKET_ESTADO_VARIANT[t.estado]}>
                    {TICKET_ESTADO_LABEL[t.estado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={TICKET_PRIORIDAD_VARIANT[t.prioridad]}>
                    {TICKET_PRIORIDAD_LABEL[t.prioridad]}
                  </Badge>
                </TableCell>
                <TableCell>{t.creadoPor.nombre}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.updatedAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href={`/soporte/${t.id}`} />}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
