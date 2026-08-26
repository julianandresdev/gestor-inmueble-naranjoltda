import Link from "next/link";
import { requireAdmin, listInmueblesArchivados } from "@/lib/dal";
import { RestaurarInmuebleButton } from "../../inmuebles/restaurar-button";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ArchivadosPage() {
  await requireAdmin();
  const inmuebles = await listInmueblesArchivados();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            Inmuebles archivados
          </h1>
          <p className="text-sm text-muted-foreground">
            Solo administradores. {inmuebles.length} archivado
            {inmuebles.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Volver
        </Button>
      </header>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Inm</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Barrio</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Última modificación</TableHead>
              <TableHead className="w-1 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inmuebles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay inmuebles archivados.
                </TableCell>
              </TableRow>
            )}
            {inmuebles.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono">
                  <Link
                    href={`/inmuebles/${i.id}`}
                    className="hover:underline"
                  >
                    {i.noInm}
                  </Link>
                </TableCell>
                <TableCell>{i.direccion ?? "—"}</TableCell>
                <TableCell>{i.barrio ?? "—"}</TableCell>
                <TableCell>{i.ciudad ?? "—"}</TableCell>
                <TableCell>{i.tipoInmueble ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDateTime(i.updatedAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.modificadoPor.nombre}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <RestaurarInmuebleButton
                    inmuebleId={i.id}
                    noInm={i.noInm}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
