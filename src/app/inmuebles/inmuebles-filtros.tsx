"use client";

import { useEffect, useState, useMemo } from "react";
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

export function InmueblesFiltros({
  ciudades,
  barrios,
  tipos,
}: {
  ciudades: string[];
  barrios: string[];
  tipos: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const ciudad = searchParams.get("ciudad") ?? "";
  const barrio = searchParams.get("barrio") ?? "";
  const tipoInmueble = searchParams.get("tipoInmueble") ?? "";
  const destinacion = searchParams.get("destinacion") ?? "";

  // Debounce de la búsqueda libre
  useEffect(() => {
    const t = setTimeout(() => {
      if (q === (searchParams.get("q") ?? "")) return;
      updateParam("q", q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const params = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    return p;
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`/inmuebles?${p.toString()}`, { scroll: false });
  }

  const hasFiltros =
    !!q || !!ciudad || !!barrio || !!tipoInmueble || !!destinacion;

  function limpiar() {
    setQ("");
    router.replace("/inmuebles", { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          placeholder="No. Inm, dirección, arrendatario, propietario, documentos, teléfonos..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Select
            value={ciudad}
            onValueChange={(v) => updateParam("ciudad", v ?? "")}
          >
            <SelectTrigger id="ciudad" className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {ciudades.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="barrio">Barrio</Label>
          <Select
            value={barrio}
            onValueChange={(v) => updateParam("barrio", v ?? "")}
          >
            <SelectTrigger id="barrio" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {barrios.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoInmueble">Tipo de inmueble</Label>
          <Select
            value={tipoInmueble}
            onValueChange={(v) => updateParam("tipoInmueble", v ?? "")}
          >
            <SelectTrigger id="tipoInmueble" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="destinacion">Destinación</Label>
          <Select
            value={destinacion}
            onValueChange={(v) => updateParam("destinacion", v ?? "")}
          >
            <SelectTrigger id="destinacion" className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="VIVIENDA">Vivienda</SelectItem>
              <SelectItem value="COMERCIO">Comercio</SelectItem>
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

      <input type="hidden" name="params-snapshot" value={params.toString()} />
    </div>
  );
}