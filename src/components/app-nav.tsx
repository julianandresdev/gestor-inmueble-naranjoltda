import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { LogoutForm } from "@/components/logout-form";
import { hasPermission } from "@/lib/permissions";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <Image src="/logo.png" alt="Inmobiliaria Naranjo LTDA." width={32} height={32} className="h-8 w-auto" priority />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-sm">
          {canViewDashboard && (
            <NavLink href="/dashboard" exact>
              Inicio
            </NavLink>
          )}
          {canViewInmuebles && (
            <NavLink href="/inmuebles">
              Inmuebles
            </NavLink>
          )}
          {canViewTareas && (
            <NavLink href="/tareas">
              Tareas
            </NavLink>
          )}
          {canViewSoporte && (
            <NavLink href="/soporte">
              Soporte
            </NavLink>
          )}
          {canViewMantenimiento && (
            <NavLink href="/mantenimiento">
              Mantenimiento
            </NavLink>
          )}
          {isAdmin && (
            <NavLink href="/administracion/panel">
              Panel
            </NavLink>
          )}
          {isAdmin && (
            <NavLink href="/administracion/archivados">
              Archivados
            </NavLink>
          )}
          {isAdmin && (
            <NavLink href="/administracion/usuarios">
              Usuarios
            </NavLink>
          )}
          <NavLink href="/perfil">
            Perfil
          </NavLink>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.name} · {user.role}
          </span>
          <ThemeToggle />
          <LogoutForm />
        </div>
      </div>
    </header>
  );
}
