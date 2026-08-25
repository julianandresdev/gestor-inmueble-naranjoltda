import Link from "next/link";
import { listInmuebles, getOpcionesFiltros } from "@/lib/dal";
import { InmueblesFiltros } from "./inmuebles-filtros";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Destinacion } from "@/generated/prisma/client";

export default async function InmueblesPage({
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
    ciudad: get("ciudad"),
    barrio: get("barrio"),
    tipoInmueble: get("tipoInmueble"),
    destinacion: (get("destinacion") as Destinacion | undefined) ?? undefined,
  };

  const [inmueblesPage, opciones] = await Promise.all([
    listInmuebles(filtros),
    getOpcionesFiltros(),
  ]);
  const { items: inmuebles, total: totalInmuebles } = inmueblesPage;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Inmuebles</h1>
          <p className="text-sm text-muted-foreground">
            {totalInmuebles} inmueble{totalInmuebles === 1 ? "" : "s"} activo
            {totalInmuebles === 1 ? "" : "s"}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/inmuebles/nuevo" />}>
          Nuevo inmueble
        </Button>
      </header>

      <InmueblesFiltros
        ciudades={opciones.ciudades}
        barrios={opciones.barrios}
        tipos={opciones.tipos}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Inm</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Barrio</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Destinación</TableHead>
              <TableHead>Arrendatario</TableHead>
              <TableHead className="w-1 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inmuebles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay inmuebles que coincidan.
                </TableCell>
              </TableRow>
            )}
            {inmuebles.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono">
                  <Link
                    href={`/inmuebles/${i.id}`}
                    className="font-medium hover:underline"
                  >
                    {i.noInm}
                  </Link>
                </TableCell>
                <TableCell>{i.direccion ?? "—"}</TableCell>
                <TableCell>{i.barrio ?? "—"}</TableCell>
                <TableCell>{i.ciudad ?? "—"}</TableCell>
                <TableCell>{i.tipoInmueble ?? "—"}</TableCell>
                <TableCell>
                  {i.destinacion ? (
                    <Badge variant="secondary">
                      {i.destinacion === "VIVIENDA" ? "Vivienda" : "Comercio"}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{i.arrendatario ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href={`/inmuebles/${i.id}`} />}
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