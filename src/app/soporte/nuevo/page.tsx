import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { NuevoTicketForm } from "../nuevo-ticket-form";

export default async function NuevoSoportePage() {
  await requireAuth();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo ticket</h1>
          <p className="text-sm text-muted-foreground">
            Reporta un problema o solicitud. Se notificará al equipo por
            Telegram.
          </p>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/soporte" />}
        >
          Volver
        </Button>
      </header>

      <NuevoTicketForm />
    </main>
  );
}
