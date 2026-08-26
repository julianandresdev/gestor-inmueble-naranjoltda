import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutForm } from "@/components/logout-form";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const session = await requireAuth();
  const user = await prisma.usuario.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      nombre: true,
      username: true,
      rol: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p className="text-sm text-destructive">
          No se pudo cargar el perfil del usuario.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Tu información de cuenta y contraseña.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
            Volver
          </Button>
          <LogoutForm />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la cuenta</CardTitle>
          <CardDescription>
            Información que identifica a tu usuario en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nombre
            </dt>
            <dd className="text-sm">{user.nombre}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Usuario
            </dt>
            <dd className="font-mono text-sm">{user.username}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rol
            </dt>
            <dd>
              <Badge variant={user.rol === "ADMIN" ? "default" : "secondary"}>
                {user.rol}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </dt>
            <dd>
              <Badge
                variant={user.estado === "ACTIVO" ? "default" : "outline"}
              >
                {user.estado}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Creado
            </dt>
            <dd className="text-sm">{formatDateTime(user.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Actualizado
            </dt>
            <dd className="text-sm">{formatDateTime(user.updatedAt)}</dd>
          </div>
        </CardContent>
      </Card>

      <PerfilForm />
    </main>
  );
}