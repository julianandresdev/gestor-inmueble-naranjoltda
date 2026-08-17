import { describe, expect, it } from "vitest";
import { esVencida, ESTADO_LABEL } from "@/lib/tarea-utils";

describe("tarea-utils", () => {
  describe("esVencida", () => {
    it("retorna false si no hay fecha límite", () => {
      expect(esVencida({ estado: "SIN_ASIGNAR", fechaLimite: null })).toBe(false);
    });

    it("retorna true si la fecha límite ha pasado y no está completada", () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(
        esVencida({ estado: "EN_PROGRESO", fechaLimite: ayer })
      ).toBe(true);
    });

    it("retorna false si la fecha límite es futura", () => {
      const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(
        esVencida({ estado: "SIN_ASIGNAR", fechaLimite: mañana })
      ).toBe(false);
    });

    it("retorna false para tareas COMPLETADAS aunque la fecha haya pasado", () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(esVencida({ estado: "COMPLETADA", fechaLimite: ayer })).toBe(
        false
      );
    });

    it("retorna false para tareas CANCELADAS aunque la fecha haya pasado", () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(esVencida({ estado: "CANCELADA", fechaLimite: ayer })).toBe(
        false
      );
    });

    it("retorna true para tareas ARCHIVADAS con fecha ya pasada", () => {
      // Una tarea archivada con fecha límite pasada sigue mostrando el badge
      // (informativo); la métrica del dashboard es la que las excluye.
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(esVencida({ estado: "ARCHIVADA", fechaLimite: ayer })).toBe(true);
    });
  });

  describe("ESTADO_LABEL", () => {
    it("tiene etiqueta para todos los estados esperados", () => {
      expect(ESTADO_LABEL.SIN_ASIGNAR).toBe("Sin asignar");
      expect(ESTADO_LABEL.EN_PROGRESO).toBe("En progreso");
      expect(ESTADO_LABEL.COMPLETADA).toBe("Completada");
      expect(ESTADO_LABEL.CANCELADA).toBe("Cancelada");
      expect(ESTADO_LABEL.ARCHIVADA).toBe("Archivada");
    });
  });
});
