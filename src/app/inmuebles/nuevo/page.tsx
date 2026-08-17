import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { CrearInmuebleForm } from "./crear-inmueble-form";

export default async function NuevoInmueblePage() {
  await requireAuth();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nuevo inmueble
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra un nuevo inmueble. El No. Inm no podrá modificarse luego.
          </p>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/inmuebles" />}
        >
          Volver
        </Button>
      </header>

      <CrearInmuebleForm />
    </main>
  );
}