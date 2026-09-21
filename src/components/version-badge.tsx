"use client";

import { useState } from "react";
import { APP_VERSION, APP_CHANGELOG } from "@/lib/version";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Calendar, Tag, CheckCircle2 } from "lucide-react";

export function VersionBadge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        title="Ver historial de versiones y novedades"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>v{APP_VERSION}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] sm:max-w-xl overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gestión Inmobiliaria Naranjo
              </span>
            </div>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Registro de Novedades y Versiones</span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                v{APP_VERSION} actual
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Historial de lanzamientos, nuevas funciones, mejoras y optimizaciones del aplicativo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {APP_CHANGELOG.map((rel, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={rel.version}
                  className={`rounded-lg border p-4 transition-colors ${
                    isLatest
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border/60 bg-card/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        v{rel.version}
                      </span>
                      {isLatest && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Versión activa
                        </span>
                      )}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          rel.type === "major"
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                            : rel.type === "minor"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {rel.type}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {rel.date}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {rel.title}
                  </h4>

                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {rel.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
