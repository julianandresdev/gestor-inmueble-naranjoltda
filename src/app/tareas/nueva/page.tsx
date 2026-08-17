import Link from "next/link";
import { requireAuth, listOpcionesInmuebles } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { NuevaTareaForm } from "../nueva-tarea-form";

export default async function NuevaTareaPage() {
  await requireAuth();
  const inmuebles = await listOpcionesInmuebles();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Nueva tarea</h1>
          <p className="text-sm text-muted-foreground">
            Crea una tarea general o asociada a un inmueble.
          </p>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/tareas" />}
        >
          Volver
        </Button>
      </header>

      <NuevaTareaForm inmuebles={inmuebles} />
    </main>
  );
}