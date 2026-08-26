import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dal";
import { listarActividadReciente, ACTIVIDAD_LABELS } from "@/lib/audit";
import { esVencida, ESTADO_LABEL } from "@/lib/tarea-utils";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  const [data, actividad] = await Promise.all([
    getDashboardData(),
    listarActividadReciente(10),
  ]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"}>
              {user?.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Resumen general del sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/inmuebles/nuevo" />}>
            Nuevo inmueble
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/tareas/nueva" />}
          >
            Nueva tarea
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inmuebles activos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.inmueblesActivos}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tareas activas</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.tareasActivas}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Sin asignar: {data.kpis.tareasSinAsignar} · En progreso:{" "}
              {data.kpis.tareasEnProgreso}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencidas</CardDescription>
          </CardHeader>
          <CardContent>
            <span
              className={`text-3xl font-semibold ${
                data.kpis.tareasVencidas > 0 ? "text-destructive" : ""
              }`}
            >
              {data.kpis.tareasVencidas}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Tareas con fecha límite ya pasada.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Urgentes pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.tareasUrgentesPendientes}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sin asignar</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.tareasSinAsignar}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.tareasEnProgreso}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Soporte · Abiertos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {data.kpis.soporteAbiertos}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              En progreso: {data.kpis.soporteEnProgreso}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Tareas prioritarias</CardTitle>
            <CardDescription>
              Vencidas, urgentes, importantes o sin asignar. Pendientes de
              cierre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.tareasPrioritarias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin tareas que requieran atención.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {data.tareasPrioritarias.map((t) => {
                  const vencida = esVencida(t);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/tareas/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.titulo}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{ESTADO_LABEL[t.estado]}</span>
                          {t.asignadaA && <span>· {t.asignadaA.nombre}</span>}
                          {t.inmueble && (
                            <span>
                              ·{" "}
                              <Link
                                href={`/inmuebles/${t.inmueble.id}`}
                                className="font-mono hover:underline"
                              >
                                {t.inmueble.noInm}
                              </Link>
                            </span>
                          )}
                          {t.fechaLimite && (
                            <span>
                              · {t.fechaLimite.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {vencida && (
                          <Badge variant="outline">Vencida</Badge>
                        )}
                        {t.urgente && <Badge variant="destructive">Urgente</Badge>}
                        {t.importante && <Badge>Importante</Badge>}
                        {t.estado === "SIN_ASIGNAR" && (
                          <Badge variant="secondary">Sin asignar</Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimas acciones registradas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actividad.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay actividad reciente.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {actividad.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <Link href={a.href} className="font-medium hover:underline">
                        {ACTIVIDAD_LABELS[a.tipo] ?? a.tipo}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {a.user}
                        {a.context ? ` · ${a.context}` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
