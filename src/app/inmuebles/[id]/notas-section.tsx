import { listarNotas } from "@/lib/dal";
import { NuevaNotaForm } from "./nueva-nota-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function NotasSection({
  inmuebleId,
  activo,
}: {
  inmuebleId: string;
  activo: boolean;
}) {
  const notas = await listarNotas(inmuebleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas de seguimiento</CardTitle>
        <CardDescription>
          Historial de seguimiento realizado sobre este inmueble.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {activo && <NuevaNotaForm inmuebleId={inmuebleId} />}

        <div className="flex flex-col gap-3">
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay notas registradas para este inmueble.
            </p>
          ) : (
            notas.map((nota) => (
              <div
                key={nota.id}
                className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{nota.autor.nombre}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {nota.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{nota.contenido}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}