"use client";

/**
 * inmuebles-seleccion.tsx
 *
 * Contenedor cliente para la tabla de inmuebles con soporte de selección múltiple.
 *
 * Características:
 * - Checkboxes por fila y "seleccionar todos los visibles".
 * - La selección se guarda en sessionStorage → persiste al navegar a un detalle y volver,
 *   o al cambiar de página/filtro.
 * - El estado interno usa Map<id, { noInm, direccion }> para poder mostrar datos de inmuebles
 *   que ya no están visibles en la tabla actual (seleccionados en otra búsqueda/página).
 * - Barra flotante que aparece cuando hay ≥1 seleccionado con:
 *   · Contador clickeable que despliega la lista previa de seleccionados (noInm + dirección).
 *   · Botón "Limpiar" y "Archivar seleccionados".
 * - Diálogo de confirmación antes de archivar con lista completa.
 * - Limpieza automática de la selección tras archivar con éxito.
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/spinner";

import type { InmuebleListItem } from "@/lib/dal";
import { archivarInmueblesSeleccionados } from "./actions";

/* ─────────────────────────────────────── tipos ─── */

type DatosSeleccion = { noInm: string; direccion: string | null };
/** Map<id, DatosSeleccion> — permite mostrar datos de inmuebles fuera de la vista actual */
type SeleccionMap = Map<string, DatosSeleccion>;

const SESSION_KEY = "inmuebles-seleccion-v1";

/* ─────────────────────────────────────── sessionStorage helpers ─── */

function guardarEnSession(mapa: SeleccionMap): void {
  try {
    const obj: Record<string, DatosSeleccion> = {};
    mapa.forEach((v, k) => { obj[k] = v; });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
  } catch {
    // SSR o private browsing sin sessionStorage
  }
}

function leerDeSession(): SeleccionMap {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, DatosSeleccion>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

/* ─────────────────────────────────────── componente ──────── */

export function InmueblesTablaSeleccion({
  inmuebles,
}: {
  inmuebles: InmuebleListItem[];
}) {
  const router = useRouter();

  /**
   * Map<id, {noInm, direccion}> — estado central de selección.
   * Inicializado lazy desde sessionStorage para que sobreviva navegaciones.
   */
  const [seleccionados, setSeleccionados] = useState<SeleccionMap>(() => new Map());
  const [mounted, setMounted] = useState(false);

  // Diálogo de confirmación de archivado
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Desplegable de vista previa en la barra flotante
  const [previstaAbierta, setPrevistaAbierta] = useState(false);

  const [pending, startTransition] = useTransition();

  /* ── restaurar desde sessionStorage al montar (solo cliente) ── */
  useEffect(() => {
    setSeleccionados(leerDeSession());
    setMounted(true);
  }, []);

  /* ── persistir en sessionStorage cada vez que cambia la selección ── */
  const actualizarSeleccion = useCallback((siguiente: SeleccionMap) => {
    setSeleccionados(siguiente);
    guardarEnSession(siguiente);
  }, []);

  /* ─── helpers de selección ─── */

  const idsVisibles = inmuebles.map((i) => i.id);
  const visiblesSeleccionados = idsVisibles.filter((id) => seleccionados.has(id));
  const todosMarcados =
    idsVisibles.length > 0 && visiblesSeleccionados.length === idsVisibles.length;
  const algunoMarcado = visiblesSeleccionados.length > 0;

  function toggleUno(inmueble: InmuebleListItem) {
    const siguiente = new Map(seleccionados);
    if (siguiente.has(inmueble.id)) {
      siguiente.delete(inmueble.id);
    } else {
      siguiente.set(inmueble.id, { noInm: inmueble.noInm, direccion: inmueble.direccion });
    }
    actualizarSeleccion(siguiente);
  }

  function toggleTodosVisibles() {
    const siguiente = new Map(seleccionados);
    if (todosMarcados) {
      idsVisibles.forEach((id) => siguiente.delete(id));
    } else {
      inmuebles.forEach((i) =>
        siguiente.set(i.id, { noInm: i.noInm, direccion: i.direccion })
      );
    }
    actualizarSeleccion(siguiente);
  }

  function limpiarSeleccion() {
    actualizarSeleccion(new Map());
    setPrevistaAbierta(false);
  }

  /* ─── datos de la selección para mostrar en barra y diálogo ─── */

  /** Entradas ordenadas por noInm para la barra y el diálogo */
  const seleccionadosArray = Array.from(seleccionados.entries())
    .map(([id, datos]) => ({ id, ...datos }))
    .sort((a, b) => a.noInm.localeCompare(b.noInm, undefined, { numeric: true }));

  /* ─── archivado masivo ─── */

  async function confirmarArchivado() {
    startTransition(async () => {
      const ids = seleccionadosArray.map((s) => s.id);
      const res = await archivarInmueblesSeleccionados(ids);

      if (res.ok) {
        toast.success(
          `${ids.length} inmueble${ids.length !== 1 ? "s" : ""} archivado${ids.length !== 1 ? "s" : ""} correctamente`
        );
        limpiarSeleccion();
        setDialogAbierto(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudieron archivar los inmuebles");
        setDialogAbierto(false);
      }
    });
  }

  /* ─── render ─── */

  return (
    <>
      {/* ───── Barra flotante de acciones ───── */}
      {mounted && seleccionados.size > 0 && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-200 fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-max max-w-[calc(100vw-2rem)]">
          <div className="flex flex-col rounded-2xl border bg-background shadow-xl ring-1 ring-foreground/10 overflow-hidden">

            {/* ── Fila principal de la barra ── */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              {/* Contador — abre/cierra la lista previa */}
              <button
                type="button"
                onClick={() => setPrevistaAbierta((v) => !v)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-muted/60 transition-colors"
                aria-expanded={previstaAbierta}
                title={previstaAbierta ? "Ocultar seleccionados" : "Ver seleccionados"}
              >
                <span>
                  {seleccionados.size} seleccionado{seleccionados.size !== 1 ? "s" : ""}
                </span>
                {previstaAbierta ? (
                  <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronUpIcon className="size-3.5 text-muted-foreground" />
                )}
              </button>

              <div className="h-4 w-px bg-border" />

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={limpiarSeleccion}
                className="text-muted-foreground h-7 px-2 text-xs"
              >
                Limpiar
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setDialogAbierto(true)}
                className="h-7 px-3 text-xs"
              >
                <ArchiveIcon className="mr-1 size-3" />
                Archivar seleccionados
              </Button>
            </div>

            {/* ── Vista previa desplegable ── */}
            {previstaAbierta && (
              <div className="border-t">
                <ul className="no-scrollbar max-h-52 overflow-y-auto py-1 text-xs">
                  {seleccionadosArray.map((s) => (
                    <li
                      key={s.id}
                      className="group flex items-center justify-between gap-3 px-4 py-1.5 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-semibold shrink-0">{s.noInm}</span>
                        {s.direccion ? (
                          <span className="truncate text-muted-foreground">
                            — {s.direccion}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">sin dirección</span>
                        )}
                      </div>
                      {/* Botón para deseleccionar individualmente desde la barra */}
                      <button
                        type="button"
                        onClick={() => {
                          const siguiente = new Map(seleccionados);
                          siguiente.delete(s.id);
                          actualizarSeleccion(siguiente);
                          if (siguiente.size === 0) setPrevistaAbierta(false);
                        }}
                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        aria-label={`Deseleccionar ${s.noInm}`}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Tabla ───── */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={todosMarcados}
                  indeterminate={algunoMarcado && !todosMarcados}
                  onCheckedChange={toggleTodosVisibles}
                  aria-label="Seleccionar todos los inmuebles visibles"
                />
              </TableHead>
              <TableHead>No. Inm</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Barrio</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Destinación</TableHead>
              <TableHead>Arrendatario</TableHead>
              <TableHead className="w-1 text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inmuebles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No hay inmuebles que coincidan.
                </TableCell>
              </TableRow>
            )}
            {inmuebles.map((i) => {
              const marcado = seleccionados.has(i.id);
              return (
                <TableRow
                  key={i.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/60 ${
                    marcado ? "bg-muted/40" : ""
                  }`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("[data-slot='checkbox']") ||
                      target.closest("a") ||
                      target.closest("button")
                    )
                      return;
                    router.push(`/inmuebles/${i.id}`);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={() => toggleUno(i)}
                      aria-label={`Seleccionar inmueble ${i.noInm}`}
                    />
                  </TableCell>

                  <TableCell className="font-mono">
                    <Link
                      href={`/inmuebles/${i.id}`}
                      className="font-medium hover:underline"
                    >
                      {i.noInm}
                    </Link>
                  </TableCell>
                  <TableCell>{i.direccion ?? "—"}</TableCell>
                  <TableCell>{i.barrio ?? "—"}</TableCell>
                  <TableCell>{i.ciudad ?? "—"}</TableCell>
                  <TableCell>{i.tipoInmueble ?? "—"}</TableCell>
                  <TableCell>
                    {i.destinacion ? (
                      <Badge variant="secondary">
                        {i.destinacion === "VIVIENDA" ? "Vivienda" : "Comercio"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{i.arrendatario ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href={`/inmuebles/${i.id}`} />}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ───── Diálogo de confirmación de archivado masivo ───── */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>¿Archivar inmuebles seleccionados?</DialogTitle>
            <DialogDescription>
              Esta acción archivará{" "}
              <strong>{seleccionadosArray.length}</strong> inmueble
              {seleccionadosArray.length !== 1 ? "s" : ""}. Los inmuebles
              archivados dejan de aparecer en el inventario activo pero se
              pueden restaurar desde la sección de archivados.
            </DialogDescription>
          </DialogHeader>

          {seleccionadosArray.length > 0 && (
            <ul className="no-scrollbar max-h-48 overflow-y-auto rounded-md border bg-muted/30 py-1 text-sm">
              {seleccionadosArray.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="font-mono font-medium">{s.noInm}</span>
                  {s.direccion && (
                    <span className="truncate text-muted-foreground">
                      — {s.direccion}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDialogAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={confirmarArchivado}
            >
              {pending && <Spinner className="mr-2" />}
              {pending ? "Archivando..." : "Sí, archivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
