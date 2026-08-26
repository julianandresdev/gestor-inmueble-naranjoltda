import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { LogoutForm } from "@/components/logout-form";

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user;
  const isAdmin = user.role === "ADMIN";
  const isAsesor = user.role === "ASESOR";
  const isMantenimiento = user.role === "MANTENIMIENTO";

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href={isMantenimiento ? "/mantenimiento" : "/dashboard"} className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Naranjo Ltda." width={32} height={32} className="h-8 w-auto" priority />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
            {!isMantenimiento && (
              <Link
                href="/dashboard"
                className="rounded px-2 py-1 font-medium hover:bg-muted"
              >
                Dashboard
              </Link>
            )}
            {!isMantenimiento && (
              <Link
                href="/inmuebles"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Inmuebles
              </Link>
            )}
            {!isMantenimiento && (
              <Link
                href="/tareas"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Tareas
              </Link>
            )}
            {!isMantenimiento && (
              <Link
                href="/soporte"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Soporte
              </Link>
            )}
            {isMantenimiento && (
              <Link
                href="/mantenimiento"
                className="rounded px-2 py-1 font-medium hover:bg-muted"
              >
                Mantenimiento
              </Link>
            )}
            {(isAdmin || isAsesor) && (
              <Link
                href="/mantenimiento"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Mantenimiento
              </Link>
            )}
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
            <Link
              href="/perfil"
              className="rounded px-2 py-1 hover:bg-muted"
            >
              Perfil
            </Link>
          </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.name} · {user.role}
          </span>
          <LogoutForm />
        </div>
      </div>
    </header>
  );
}
