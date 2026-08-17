import Link from "next/link";
import { requireAdmin, listUsuarios } from "@/lib/dal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UsuarioFormDialog } from "./usuario-form-dialog";
import { CambiarEstadoButton } from "./cambiar-estado-button";
import { LogoutForm } from "@/components/logout-form";

export default async function UsuariosPage() {
  const current = await requireAdmin();
  const usuarios = await listUsuarios();
  const currentUserId = current.id;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra asesores y administradores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/inicio" />}>
            Volver
          </Button>
          <LogoutForm />
        </div>
      </header>

      <div className="flex justify-end">
        <UsuarioFormDialog
          mode="crear"
          trigger={<Button>Nuevo usuario</Button>}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-1 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell className="font-mono">{u.username}</TableCell>
                <TableCell>
                  <Badge variant={u.rol === "ADMIN" ? "default" : "secondary"}>
                    {u.rol}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.estado === "ACTIVO" ? "default" : "outline"}
                  >
                    {u.estado}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <UsuarioFormDialog
                    mode="editar"
                    usuario={u}
                    rolBloqueado={u.id === currentUserId}
                    trigger={<Button size="sm" variant="ghost">Editar</Button>}
                  />
                  <CambiarEstadoButton usuario={u} esSelf={u.id === currentUserId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}