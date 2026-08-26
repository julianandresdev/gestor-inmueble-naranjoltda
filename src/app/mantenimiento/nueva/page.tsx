import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, listOpcionesInmuebles } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { CrearMantenimientoForm } from "./crear-mantenimiento-form";

export default async function NuevaMantenimientoPage() {
  const user = await requireAuth();

  if (user.role !== "ADMIN" && user.role !== "ASESOR") {
    if (user.role === "MANTENIMIENTO") redirect("/mantenimiento");
    redirect("/inicio");
  }

  const opcionesInmueble = await listOpcionesInmuebles();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nueva tarea de mantenimiento
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea una tarea pendiente para que el equipo de mantenimiento la
            reclame.
          </p>
        </div>
        <Button variant="ghost" nativeButton={false} render={<Link href="/mantenimiento" />}>
          Volver
        </Button>
      </header>

      <CrearMantenimientoForm inmuebles={opcionesInmueble} />
    </main>
  );
}