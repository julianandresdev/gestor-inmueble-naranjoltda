import Link from "next/link";
import { listInmuebles, getOpcionesFiltros } from "@/lib/dal";
import { InmueblesFiltros } from "./inmuebles-filtros";
import { InmueblesTablaSeleccion } from "./inmuebles-seleccion";
import { Button } from "@/components/ui/button";
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

      {/* La tabla con selección múltiple vive en un Client Component para
          que el estado de selección persista entre búsquedas */}
      <InmueblesTablaSeleccion inmuebles={inmuebles} />
    </main>
  );
}