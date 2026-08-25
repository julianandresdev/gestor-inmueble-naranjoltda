import Link from "next/link";
import { listTareas, getResumenTareas, listResponsables } from "@/lib/dal";
import { TareasFiltros } from "./tareas-filtros";
import { ESTADO_LABEL, esVencida } from "@/lib/tarea-utils";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TareaEstado } from "@/generated/prisma/client";

function EstadoBadge({ estado }: { estado: TareaEstado }) {
  const variants: Record<TareaEstado, "default" | "secondary" | "outline" | "destructive"> = {
    SIN_ASIGNAR: "secondary",
    EN_PROGRESO: "default",
    COMPLETADA: "outline",
    CANCELADA: "destructive",
    ARCHIVADA: "outline",
  };
  return <Badge variant={variants[estado]}>{ESTADO_LABEL[estado]}</Badge>;
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const filtros = {
    q: get("q"),
    estado: (get("estado") as TareaEstado | undefined) ?? undefined,
    responsable: get("responsable"),
    importante: get("importante") ? true : undefined,
    urgente: get("urgente") ? true : undefined,
    vencidas: get("vencidas") ? true : undefined,
    tipo: (get("tipo") as "con-inmueble" | "generales" | undefined) ?? undefined,
  };

  const [tareasPage, resumen, responsables] = await Promise.all([
    listTareas(filtros),
    getResumenTareas(),
    listResponsables(),
  ]);
  const { items: tareas } = tareasPage;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Sistema colaborativo de tareas.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/tareas/nueva" />}>
          Nueva tarea
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sin asignar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.sinAsignar}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.enProgreso}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{resumen.completadas}</span>
          </CardContent>
        </Card>
      </div>

      <TareasFiltros responsables={responsables} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Inmueble</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead className="w-1 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tareas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay tareas que coincidan.
                </TableCell>
              </TableRow>
            )}
            {tareas.map((t) => {
              const vencida = esVencida(t);
              return (
                <TableRow key={t.id}>
                  <TableCell className="max-w-64">
                    <span className="line-clamp-2 font-medium">{t.titulo}</span>
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
                      <span className="text-muted-foreground">General</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={t.estado} />
                  </TableCell>
                  <TableCell>{t.asignadaA?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.importante && (
                        <Badge variant="default">Importante</Badge>
                      )}
                      {t.urgente && <Badge variant="destructive">Urgente</Badge>}
                      {vencida && <Badge variant="outline">Vencida</Badge>}
                      {!t.importante && !t.urgente && !vencida && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.fechaLimite ? (
                      <span className={vencida ? "text-destructive" : ""}>
                        {t.fechaLimite.toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href={`/tareas/${t.id}`} />}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}