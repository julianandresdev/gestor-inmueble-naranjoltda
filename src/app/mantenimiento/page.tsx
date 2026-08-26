import Link from "next/link";
import {
  getCurrentUser,
  listMantenimientoTareas,
  getMantenimientoResumen,
} from "@/lib/dal";
import { redirect } from "next/navigation";
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
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { TareaEstado } from "@/generated/prisma/client";
import { MantenimientoAcciones } from "./tarea-acciones";

const ESTADO_LABEL: Record<TareaEstado, string> = {
  SIN_ASIGNAR: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Finalizada",
  CANCELADA: "Cancelada",
  ARCHIVADA: "Archivada",
};

const ESTADO_VARIANT: Record<TareaEstado, "default" | "secondary" | "outline" | "destructive"> = {
  SIN_ASIGNAR: "secondary",
  EN_PROGRESO: "default",
  COMPLETADA: "outline",
  CANCELADA: "destructive",
  ARCHIVADA: "outline",
};

export default async function MantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const estadoParam = sp.estado;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const estadoFiltro: TareaEstado | "TODOS" =
    typeof estadoParam === "string" &&
    ["SIN_ASIGNAR", "EN_PROGRESO", "COMPLETADA"].includes(estadoParam)
      ? (estadoParam as TareaEstado)
      : "TODOS";

  const [page, resumen] = await Promise.all([
    listMantenimientoTareas({ estado: estadoFiltro, q }),
    getMantenimientoResumen(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mantenimiento
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.role === "MANTENIMIENTO"
              ? "Tareas de mantenimiento disponibles y activas."
              : "Crea y supervisa las tareas de mantenimiento."}
          </p>
        </div>
        {(session.role === "ADMIN" || session.role === "ASESOR") && (
          <Button nativeButton={false} render={<Link href="/mantenimiento/nueva" />}>
            Nueva tarea
          </Button>
        )}
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.pendientes}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.enProgreso}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Finalizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.finalizadas}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tareas</CardTitle>
          <CardDescription>
            {page.total} resultado{page.total === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="mb-4 flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="estado"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                defaultValue={estadoFiltro}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="TODOS">Todas</option>
                <option value="SIN_ASIGNAR">Pendientes</option>
                <option value="EN_PROGRESO">En progreso</option>
                <option value="COMPLETADA">Finalizadas</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="q"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Buscar
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Título o descripción…"
                className="h-9 rounded-md border bg-background px-2 text-sm"
              />
            </div>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Inmueble</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Fecha límite</TableHead>
                  <TableHead className="w-1 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No hay tareas de mantenimiento.
                    </TableCell>
                  </TableRow>
                )}
                {page.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        href={`/mantenimiento/${t.id}`}
                        className="line-clamp-2 font-medium hover:underline"
                      >
                        {t.titulo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {t.inmueble ? (
                        <Link
                          href={`/inmuebles/${t.inmueble.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {t.inmueble.noInm}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Sin inmueble
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.inmueble?.nombreContacto ? (
                        <div className="flex flex-col">
                          <span>{t.inmueble.nombreContacto}</span>
                          {t.inmueble.telefonoContacto ? (
                            <span className="text-xs text-muted-foreground">
                              {t.inmueble.telefonoContacto}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_VARIANT[t.estado]}>
                        {ESTADO_LABEL[t.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.asignadaA ? (
                        <span className="text-sm">{t.asignadaA.nombre}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.fechaLimite ? formatDate(t.fechaLimite) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MantenimientoAcciones
                        tareaId={t.id}
                        estado={t.estado}
                        assignedToId={t.asignadaA?.id ?? null}
                        currentUserId={session.id}
                        currentUserRole={session.role}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}