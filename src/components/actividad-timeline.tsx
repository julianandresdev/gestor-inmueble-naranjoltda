import {
  ACTIVIDAD_LABELS,
  ACTIVIDAD_PREFIX,
  type ActividadItem,
} from "@/lib/audit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ActividadTimeline({
  title = "Actividad",
  description = "Historial de acciones registradas sobre este elemento.",
  items,
  emptyText = "Sin actividad registrada.",
}: {
  title?: string;
  description?: string;
  items: ActividadItem[];
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden className="text-xs text-muted-foreground">
                      {ACTIVIDAD_PREFIX[a.tipo] ?? "•"}
                    </span>
                    {ACTIVIDAD_LABELS[a.tipo] ?? a.tipo}
                  </div>
                  {a.context && (
                    <p className="text-xs text-muted-foreground">{a.context}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                  <span>{a.user}</span>
                  <span>{a.createdAt.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
