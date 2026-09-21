import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getAdminPanelData, type PeriodoFiltro } from "@/lib/dal-admin-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVIDAD_LABELS } from "@/lib/audit";
import { APP_VERSION } from "@/lib/version";

interface PageProps {
  searchParams: Promise<{
    periodo?: string;
  }>;
}

function formatearFechaHora(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatearFechaCorta(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function AdminPanelPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const rawPeriodo = params.periodo;
  const periodo: PeriodoFiltro =
    rawPeriodo === "hoy" || rawPeriodo === "30d" ? rawPeriodo : "7d";

  const data = await getAdminPanelData(periodo);

  const hayAlertas =
    data.alertas.tareasVencidas.length > 0 ||
    data.alertas.mantenimientosEstancados.length > 0 ||
    data.alertas.intentosFallidosSospechosos.length > 0;

  const totalActividadesPeriodo = data.equipo.actividadPorModulo.reduce(
    (acc, m) => acc + m.total,
    0
  );

  const maxActividadDia = Math.max(
    ...data.equipo.actividadPorDia.map((d) => d.total),
    1
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8">
      {/* 1. Header con Filtros de Rango */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Panel de Administración</h1>
            <Badge variant="outline" className="text-xs font-normal">
              Métricas y Auditoría
            </Badge>
            <span className="font-mono text-xs font-semibold rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-muted-foreground">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoreo en vivo de actividad, auditoría de seguridad y salud operativa de la inmobiliaria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-1 text-xs">
            <Link
              href="/administracion/panel?periodo=hoy"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                periodo === "hoy"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hoy
            </Link>
            <Link
              href="/administracion/panel?periodo=7d"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                periodo === "7d"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Últimos 7 días
            </Link>
            <Link
              href="/administracion/panel?periodo=30d"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                periodo === "30d"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Últimos 30 días
            </Link>
          </div>

          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/administracion/usuarios" />}>
            Usuarios
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/administracion/archivados" />}>
            Archivados
          </Button>
        </div>
      </header>

      {/* 2. Banner de Alertas Destacadas */}
      {hayAlertas && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 text-card-foreground">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive font-bold text-sm">
              !
            </span>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-destructive">
                  Alertas operativas y de seguridad pendientes de atención
                </h2>
                <p className="text-xs text-muted-foreground">
                  Se detectaron elementos que requieren supervisión inmediata de administración.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                {/* Tareas vencidas */}
                {data.alertas.tareasVencidas.length > 0 && (
                  <div className="rounded-lg border bg-background/80 p-3 space-y-1.5">
                    <div className="font-semibold text-destructive flex items-center justify-between">
                      <span>Tareas vencidas (&gt;3 días)</span>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {data.alertas.tareasVencidas.length}
                      </Badge>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      {data.alertas.tareasVencidas.slice(0, 3).map((t) => (
                        <li key={t.id} className="truncate">
                          <Link href={`/tareas/${t.id}`} className="hover:underline text-foreground font-medium">
                            {t.titulo}
                          </Link>{" "}
                          ({t.diasVencida}d atras · {t.asignadoA ?? "Sin asignar"})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mantenimientos estancados */}
                {data.alertas.mantenimientosEstancados.length > 0 && (
                  <div className="rounded-lg border bg-background/80 p-3 space-y-1.5">
                    <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                      <span>Mantenimientos estancados (&gt;7 días)</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-400/40">
                        {data.alertas.mantenimientosEstancados.length}
                      </Badge>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      {data.alertas.mantenimientosEstancados.slice(0, 3).map((m) => (
                        <li key={m.id} className="truncate">
                          <Link href={`/mantenimiento/${m.id}`} className="hover:underline text-foreground font-medium">
                            {m.titulo}
                          </Link>{" "}
                          ({m.diasInactivo}d sin cambios · {m.asignadoA ?? "Sin asignar"})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Intentos fallidos sospechosos */}
                {data.alertas.intentosFallidosSospechosos.length > 0 && (
                  <div className="rounded-lg border bg-background/80 p-3 space-y-1.5">
                    <div className="font-semibold text-destructive flex items-center justify-between">
                      <span>Fallas repetidas de login (24h)</span>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {data.alertas.intentosFallidosSospechosos.length}
                      </Badge>
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                      {data.alertas.intentosFallidosSospechosos.slice(0, 3).map((f, i) => (
                        <li key={i} className="truncate">
                          <span className="font-mono text-foreground">{f.identificador}</span>: {f.totalFallos} intentos{" "}
                          {f.ciudad ? `(${f.ciudad}, ${f.pais ?? "CO"})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Tarjetas Resumen (KPIs principales) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Inmuebles */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">Inmuebles</CardDescription>
            <CardTitle className="text-2xl font-bold">{data.kpis.inmuebles.activos}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-0.5">
            <p>
              <span className="font-medium text-foreground">{data.kpis.inmuebles.total}</span> total en catálogo
            </p>
            <p>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{data.kpis.inmuebles.nuevosEnPeriodo}</span> en este periodo
            </p>
          </CardContent>
        </Card>

        {/* Tareas */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">Tareas Generales</CardDescription>
            <CardTitle className="text-2xl font-bold">{data.kpis.tareas.pendientes}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-0.5">
            <p>
              {data.kpis.tareas.vencidas > 0 ? (
                <span className="text-destructive font-medium">{data.kpis.tareas.vencidas} vencidas</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Al día</span>
              )}
            </p>
            <p>{data.kpis.tareas.completadasEnPeriodo} completadas en el periodo</p>
          </CardContent>
        </Card>

        {/* Mantenimiento */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">Mantenimiento</CardDescription>
            <CardTitle className="text-2xl font-bold">{data.kpis.mantenimiento.abiertos}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-0.5">
            <p>
              <span className="font-medium text-amber-600 dark:text-amber-400">{data.kpis.mantenimiento.sinAsignar}</span> sin asignar
            </p>
            <p>{data.kpis.mantenimiento.enProgreso} en progreso</p>
          </CardContent>
        </Card>

        {/* Soporte */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">Soporte Técnico</CardDescription>
            <CardTitle className="text-2xl font-bold">{data.kpis.soporte.abiertos}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-0.5">
            <p>
              {data.kpis.soporte.urgentesAbiertos > 0 ? (
                <span className="text-destructive font-medium">{data.kpis.soporte.urgentesAbiertos} urgentes</span>
              ) : (
                <span className="text-muted-foreground">Sin casos urgentes</span>
              )}
            </p>
            <p>{data.kpis.soporte.resueltosEnPeriodo} resueltos en el periodo</p>
          </CardContent>
        </Card>

        {/* Presencia del Equipo */}
        <Card className="col-span-2 sm:col-span-1 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider text-primary">Equipo en línea</CardDescription>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <CardTitle className="text-2xl font-bold">{data.kpis.equipo.conectadosAhora}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-0.5">
            <p>de {data.kpis.equipo.totalActivos} usuarios activos</p>
            <p className="text-[11px] text-muted-foreground">Actualización continua</p>
          </CardContent>
        </Card>
      </section>

      {/* 4. Actividad del Equipo & Presencia en Vivo */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Presencia en Vivo (Columna 1) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Usuarios Conectados Ahora</CardTitle>
              <Badge variant="outline" className="text-xs font-normal border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                {data.equipo.conectados.length} en línea
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Sesiones con actividad en los últimos 3 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.equipo.conectados.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No hay usuarios conectados activamente en este momento.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {data.equipo.conectados.map((c) => (
                  <div key={c.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-foreground truncate">{c.nombre}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {c.rol}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        @{c.username} · {c.ip}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Ruta: <span className="text-foreground">{c.rutaActual}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                      <span>{c.minutosInactivo === 0 ? "Ahora" : `Hace ${c.minutosInactivo}m`}</span>
                      <p className="text-[10px] text-muted-foreground/80 truncate max-w-[100px]">
                        {c.dispositivo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Actividad Diaria & Desglose por Módulo (Columna 2 y 3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actividad diaria */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Volumen de Actividad Diaria</CardTitle>
                  <CardDescription className="text-xs">
                    Total de acciones realizadas en el sistema ({totalActividadesPeriodo} en el periodo).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.equipo.actividadPorDia.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  No hay registros de actividad en este periodo.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-2 border-b">
                    {data.equipo.actividadPorDia.map((item) => {
                      const alturaPorc = Math.max(8, Math.round((item.total / maxActividadDia) * 100));
                      return (
                        <div key={item.fecha} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.total}
                          </span>
                          <div
                            style={{ height: `${alturaPorc}%` }}
                            className="w-full max-w-[36px] rounded-t-sm bg-primary/80 hover:bg-primary transition-all"
                          />
                          <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                            {formatearFechaCorta(item.fecha)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desglose por Módulo */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Distribución por módulo
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {data.equipo.actividadPorModulo.map((m) => {
                        const pct = totalActividadesPeriodo > 0 ? Math.round((m.total / totalActividadesPeriodo) * 100) : 0;
                        return (
                          <div key={m.modulo} className="rounded-lg border bg-muted/20 p-2 space-y-1">
                            <span className="font-medium capitalize text-foreground">{m.modulo.toLowerCase()}</span>
                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                              <span>{m.total} acc.</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen por Usuario */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Resumen de Actividad por Asesor / Administrador</CardTitle>
              <CardDescription className="text-xs">
                Acciones registradas en el periodo por cada miembro del equipo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Usuario</TableHead>
                      <TableHead className="text-xs">Rol</TableHead>
                      <TableHead className="text-xs text-right">Total Acciones</TableHead>
                      <TableHead className="text-xs">Última Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equipo.resumenUsuarios.map((u) => (
                      <TableRow key={u.userId}>
                        <TableCell className="font-medium text-xs">
                          {u.nombre}{" "}
                          <span className="text-muted-foreground font-mono text-[11px]">@{u.username}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold">
                          {u.totalAcciones}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.ultimaAccion ? formatearFechaHora(u.ultimaAccion) : "Sin actividad reciente"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Seguridad y Registro de Accesos */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Seguridad y Auditoría de Accesos</h2>
          <p className="text-xs text-muted-foreground">
            Monitoreo de inicios de sesión, intentos fallidos, dispositivos utilizados y eventos sensibles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Métricas de acceso */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Eventos de Autenticación</CardTitle>
              <CardDescription className="text-xs">En el periodo seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Inicios de sesión exitosos</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.seguridad.resumenAccesos.exitosos}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Intentos fallidos de login</span>
                <span className="font-bold text-destructive">
                  {data.seguridad.resumenAccesos.fallidos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cierres de sesión (logouts)</span>
                <span className="font-bold text-foreground">
                  {data.seguridad.resumenAccesos.logouts}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dispositivos y Navegadores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Dispositivos y Navegadores</CardTitle>
              <CardDescription className="text-xs">Distribución de accesos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Dispositivo</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {data.seguridad.dispositivos.map((d) => (
                    <Badge key={d.tipo} variant="secondary" className="text-[11px]">
                      {d.tipo}: {d.total}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Navegador</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {data.seguridad.navegadores.map((n) => (
                    <Badge key={n.nombre} variant="outline" className="text-[11px]">
                      {n.nombre}: {n.total}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accesos fuera de horario laboral */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Accesos Fuera de Horario</CardTitle>
                {data.seguridad.accesosFueraDeHorario.length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400/40">
                    Alerta
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Logins en noches (&gt;8pm o &lt;6am) o fines de semana
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs">
              {data.seguridad.accesosFueraDeHorario.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No se detectaron accesos fuera de horario en los registros recientes.
                </p>
              ) : (
                <ul className="space-y-2 text-muted-foreground divide-y">
                  {data.seguridad.accesosFueraDeHorario.map((a) => (
                    <li key={a.id} className="pt-1.5 first:pt-0 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{a.username}</span>{" "}
                        <span className="text-[11px] font-mono text-muted-foreground">({a.ip})</span>
                      </div>
                      <span className="text-[11px]">{formatearFechaHora(a.fecha)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tablas: Intentos Fallidos & Eventos Sensibles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intentos Fallidos Recientes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Últimos Intentos Fallidos de Inicio de Sesión</CardTitle>
              <CardDescription className="text-xs">
                Historial para detectar posibles ataques o bloqueos de contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Usuario Ingresado</TableHead>
                      <TableHead className="text-xs">IP / Ubicación</TableHead>
                      <TableHead className="text-xs">Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.seguridad.intentosFallidosRecientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                          No hay intentos fallidos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.seguridad.intentosFallidosRecientes.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatearFechaHora(r.fecha)}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-medium">
                            {r.username}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-mono">{r.ip}</span>
                            {r.ciudad && (
                              <span className="text-muted-foreground block text-[10px]">
                                {r.ciudad}, {r.pais ?? "CO"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-destructive">
                            {r.motivo ?? "Credenciales inválidas"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Registro de Eventos Sensibles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Registro de Eventos Sensibles</CardTitle>
              <CardDescription className="text-xs">
                Acciones críticas: contraseñas, cambios de usuario, archivos y exportaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Evento</TableHead>
                      <TableHead className="text-xs">Responsable</TableHead>
                      <TableHead className="text-xs">Detalle / Contexto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.seguridad.eventosSensibles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                          No hay eventos sensibles registrados recientemente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.seguridad.eventosSensibles.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatearFechaHora(e.fecha)}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px]">
                              {ACTIVIDAD_LABELS[e.tipo] ?? e.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {e.usuario}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {e.contexto ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Salud del Inventario y Distribución Operativa */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salud del Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Salud del Inventario de Inmuebles</CardTitle>
            <CardDescription className="text-xs">
              Calidad de datos, disponibilidad comercial y estado del catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block">Sin Propietario</span>
                <span className="text-xl font-bold text-foreground">{data.inventario.sinPropietario}</span>
                <span className="text-[10px] text-muted-foreground block">datos incompletos</span>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block">Sin Arrendatario</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.inventario.sinArrendatario}
                </span>
                <span className="text-[10px] text-muted-foreground block">disponibles</span>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block">Desactualizados</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {data.inventario.desactualizados90Dias}
                </span>
                <span className="text-[10px] text-muted-foreground block">&gt; 90 días</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-1.5">
                  Por Tipo de Inmueble
                </span>
                <ul className="space-y-1">
                  {data.inventario.porTipo.map((t) => (
                    <li key={t.tipo} className="flex items-center justify-between">
                      <span className="text-foreground">{t.tipo}</span>
                      <span className="font-medium text-muted-foreground">{t.total}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-1.5">
                  Por Destinación
                </span>
                <ul className="space-y-1">
                  {data.inventario.porDestinacion.map((d) => (
                    <li key={d.destinacion} className="flex items-center justify-between">
                      <span className="text-foreground">{d.destinacion}</span>
                      <span className="font-medium text-muted-foreground">{d.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución Operativa de Tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Carga Operativa de Tareas</CardTitle>
            <CardDescription className="text-xs">
              Distribución de responsabilidades y matriz de prioridad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Carga por Usuario */}
            <div>
              <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-2">
                Tareas Pendientes por Responsable
              </span>
              <div className="space-y-1.5">
                {data.tareasOperativas.cargaPorUsuario.map((c) => (
                  <div key={c.usuario} className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.usuario}</span>
                    <Badge variant="secondary" className="text-xs">
                      {c.total} tareas
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Matriz de prioridad */}
            <div className="pt-2 border-t">
              <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-2">
                Matriz de Prioridad (Pendientes)
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                  <span className="text-[10px] uppercase font-bold text-destructive block">Urgente + Importante</span>
                  <span className="text-lg font-bold text-destructive">
                    {data.tareasOperativas.matrizPrioridad.urgenteEImportante}
                  </span>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                    Solo Urgente
                  </span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {data.tareasOperativas.matrizPrioridad.urgente}
                  </span>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                    Solo Importante
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {data.tareasOperativas.matrizPrioridad.importante}
                  </span>
                </div>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rutinaria</span>
                  <span className="text-lg font-bold text-foreground">
                    {data.tareasOperativas.matrizPrioridad.rutinaria}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 7. Mantenimiento y Soporte */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mantenimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Gestión de Mantenimiento</CardTitle>
            <CardDescription className="text-xs">
              Antigüedad y canales de contacto para incidentes de inmuebles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Antigüedad promedio de solicitudes abiertas</span>
              <span className="font-bold text-foreground">
                {data.mantenimientoYSoporte.antiguedadPromedioDiasMantenimiento} días
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Casos estancados (&gt;7 días)</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {data.mantenimientoYSoporte.mantenimientosEstancadosTotal}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                Contacto Asignado
              </span>
              <div className="flex gap-2">
                {data.mantenimientoYSoporte.mantenimientoPorContacto.map((c) => (
                  <Badge key={c.contacto} variant="outline" className="text-xs">
                    {c.contacto}: {c.total}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soporte Técnico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tickets de Soporte Técnico</CardTitle>
            <CardDescription className="text-xs">
              Prioridades y estado de tickets del equipo operativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                Por Prioridad (Casos Abiertos)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.mantenimientoYSoporte.soportePorPrioridad.map((p) => (
                  <Badge
                    key={p.prioridad}
                    variant={p.prioridad === "URGENTE" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {p.prioridad}: {p.total}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                Por Estado General
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.mantenimientoYSoporte.soportePorEstado.map((e) => (
                  <Badge key={e.estado} variant="outline" className="text-xs">
                    {e.estado}: {e.total}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 8. Inmuebles Archivados */}
      <section className="rounded-xl border bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Inmuebles Archivados en Depósito</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hay <span className="font-semibold text-foreground">{data.archivados.total}</span> inmuebles archivados en el histórico. Durante este periodo se archivaron {data.archivados.archivadosEnPeriodo} y se restauraron {data.archivados.restauradosEnPeriodo}.
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/administracion/archivados" />}>
          Ver Inmuebles Archivados
        </Button>
      </section>
    </main>
  );
}
