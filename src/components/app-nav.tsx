import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { LogoutForm } from "@/components/logout-form";
import { hasPermission } from "@/lib/permissions";

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user;
  const isAdmin = hasPermission(user.role, "ADMINISTRACION_MANAGE");
  const canViewDashboard = hasPermission(user.role, "DASHBOARD_VIEW");
  const canViewInmuebles = hasPermission(user.role, "INMUEBLES_VIEW");
  const canViewTareas = hasPermission(user.role, "TAREAS_GENERALES_VIEW");
  const canViewMantenimiento = hasPermission(user.role, "MANTENIMIENTO_VIEW");
  const canViewSoporte = hasPermission(user.role, "SOPORTE_CREATE");
  const isMantenimiento = user.role === "MANTENIMIENTO";

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href={isMantenimiento ? "/mantenimiento" : "/dashboard"} className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Naranjo Ltda." width={32} height={32} className="h-8 w-auto" priority />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
            {canViewDashboard && (
              <Link
                href="/dashboard"
                className="rounded px-2 py-1 font-medium hover:bg-muted"
              >
                Dashboard
              </Link>
            )}
            {canViewInmuebles && (
              <Link
                href="/inmuebles"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Inmuebles
              </Link>
            )}
            {canViewTareas && (
              <Link
                href="/tareas"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Tareas
              </Link>
            )}
            {canViewSoporte && (
              <Link
                href="/soporte"
                className="rounded px-2 py-1 hover:bg-muted"
              >
                Soporte
              </Link>
            )}
            {canViewMantenimiento && (
              <Link
                href="/mantenimiento"
                className={`rounded px-2 py-1 hover:bg-muted${
                  isMantenimiento ? " font-medium" : ""
                }`}
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
