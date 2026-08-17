import Link from "next/link";
import { notFound } from "next/navigation";
import { getInmueble, requireAuth } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { EditarInmuebleForm } from "./editar-inmueble-form";

export default async function EditarInmueblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const inmueble = await getInmueble(id);
  if (!inmueble) notFound();
  if (inmueble.estado !== "ACTIVO") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <p className="text-sm text-destructive">
          No se puede editar un inmueble archivado.
        </p>
        <Button variant="ghost" nativeButton={false} render={<Link href={`/inmuebles/${id}`} />}>
          Volver al detalle
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar inmueble {inmueble.noInm}
          </h1>
          <p className="text-sm text-muted-foreground">
            El No. Inm no puede modificarse.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/inmuebles/${id}`}
            />}
          >
            Volver
          </Button>
        </div>
      </header>

      <EditarInmuebleForm inmueble={inmueble} />
    </main>
  );
}