import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { LogoutForm } from "@/components/logout-form";

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user;
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Naranjo Ltda." width={32} height={32} className="h-8 w-auto" priority />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded px-2 py-1 font-medium hover:bg-muted"
            >
              Dashboard
            </Link>
            <Link
              href="/inmuebles"
              className="rounded px-2 py-1 hover:bg-muted"
            >
              Inmuebles
            </Link>
            <Link
              href="/tareas"
              className="rounded px-2 py-1 hover:bg-muted"
            >
              Tareas
            </Link>
            <Link
              href="/soporte"
              className="rounded px-2 py-1 hover:bg-muted"
            >
              Soporte
            </Link>
            {isAdmin && (
              <Link
                href="/administracion/archivados"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Archivados
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/administracion/usuarios"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Usuarios
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.name} · {user.role}
          </span>
          <LogoutForm />
        </div>
      </div>
    </header>
  );
}
