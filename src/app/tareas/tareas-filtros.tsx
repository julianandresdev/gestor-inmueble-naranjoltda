"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TareasFiltros({
  responsables,
}: {
  responsables: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const estado = searchParams.get("estado") ?? "";
  const responsable = searchParams.get("responsable") ?? "";
  const importante = searchParams.get("importante") ?? "";
  const urgente = searchParams.get("urgente") ?? "";
  const vencidas = searchParams.get("vencidas") ?? "";
  const tipo = searchParams.get("tipo") ?? "";

  useEffect(() => {
    const t = setTimeout(() => {
      if (q === (searchParams.get("q") ?? "")) return;
      updateParam("q", q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`/tareas?${p.toString()}`, { scroll: false });
  }

  const hasFiltros =
    !!q ||
    !!estado ||
    !!responsable ||
    !!importante ||
    !!urgente ||
    !!vencidas ||
    !!tipo;

  function limpiar() {
    setQ("");
    router.replace("/tareas", { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          placeholder="Buscar por título o descripción..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="estado">Estado</Label>
          <Select value={estado} onValueChange={(v) => updateParam("estado", v ?? "")}>
            <SelectTrigger id="estado" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="SIN_ASIGNAR">Sin asignar</SelectItem>
              <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
              <SelectItem value="COMPLETADA">Completada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="responsable">Responsable</Label>
          <Select
            value={responsable}
            onValueChange={(v) => updateParam("responsable", v ?? "")}
          >
            <SelectTrigger id="responsable" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {responsables.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => updateParam("tipo", v ?? "")}>
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="con-inmueble">Con inmueble</SelectItem>
              <SelectItem value="generales">Generales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2 pb-0.5">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={importante ? "default" : "outline"}
                onClick={() =>
                  updateParam("importante", importante ? "" : "1")
                }
              >
                Importante
              </Button>
              <Button
                type="button"
                size="sm"
                variant={urgente ? "default" : "outline"}
                onClick={() => updateParam("urgente", urgente ? "" : "1")}
              >
                Urgente
              </Button>
              <Button
                type="button"
                size="sm"
                variant={vencidas ? "destructive" : "outline"}
                onClick={() => updateParam("vencidas", vencidas ? "" : "1")}
              >
                Vencidas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {hasFiltros && (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}