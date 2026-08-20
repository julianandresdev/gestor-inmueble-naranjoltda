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

export function SoporteFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const estado = searchParams.get("estado") ?? "";
  const prioridad = searchParams.get("prioridad") ?? "";

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
    router.replace(`/soporte?${p.toString()}`, { scroll: false });
  }

  const hasFiltros = !!q || !!estado || !!prioridad;

  function limpiar() {
    setQ("");
    router.replace("/soporte", { scroll: false });
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={estado}
            onValueChange={(v) => updateParam("estado", v ?? "")}
          >
            <SelectTrigger id="estado" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="ABIERTO">Abierto</SelectItem>
              <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
              <SelectItem value="RESUELTO">Resuelto</SelectItem>
              <SelectItem value="CERRADO">Cerrado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="prioridad">Prioridad</Label>
          <Select
            value={prioridad}
            onValueChange={(v) => updateParam("prioridad", v ?? "")}
          >
            <SelectTrigger id="prioridad" className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="URGENTE">Urgente</SelectItem>
            </SelectContent>
          </Select>
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
