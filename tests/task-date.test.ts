import { describe, expect, it } from "vitest";
import { isAllowedTaskDueDate, isRealIsoDate } from "@/lib/task-date";

describe("lib/task-date — isRealIsoDate", () => {
  it("acepta fechas ISO reales", () => {
    expect(isRealIsoDate("2026-01-15")).toBe(true);
    expect(isRealIsoDate("2026-12-31")).toBe(true);
    expect(isRealIsoDate("2024-02-29")).toBe(true); // bisiesto
  });

  it("rechaza fechas inexistentes en el calendario", () => {
    expect(isRealIsoDate("2026-02-30")).toBe(false);
    expect(isRealIsoDate("2026-04-31")).toBe(false);
    expect(isRealIsoDate("2025-02-29")).toBe(false); // no bisiesto
    expect(isRealIsoDate("2026-13-01")).toBe(false);
  });

  it("rechaza formatos que no son YYYY-MM-DD", () => {
    expect(isRealIsoDate("15/01/2026")).toBe(false);
    expect(isRealIsoDate("2026-1-1")).toBe(false);
    expect(isRealIsoDate("2026-01-01T00:00:00Z")).toBe(false);
    expect(isRealIsoDate("")).toBe(false);
    expect(isRealIsoDate("abc")).toBe(false);
  });
});

describe("lib/task-date — isAllowedTaskDueDate", () => {
  it("acepta fecha de hoy y fechas futuras dentro de 5 años", () => {
    // Calculamos una fecha segura futura (ej: dentro de 6 meses)
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    const y = future.getFullYear();
    const m = String(future.getMonth() + 1).padStart(2, "0");
    const d = String(future.getDate()).padStart(2, "0");
    const futureStr = `${y}-${m}-${d}`;

    expect(isAllowedTaskDueDate(futureStr)).toBe(true);
  });

  it("rechaza fechas en el pasado", () => {
    expect(isAllowedTaskDueDate("2020-01-01")).toBe(false);
    expect(isAllowedTaskDueDate("2025-01-01")).toBe(false);
  });

  it("rechaza fechas a más de 5 años en el futuro", () => {
    expect(isAllowedTaskDueDate("2035-01-01")).toBe(false);
    expect(isAllowedTaskDueDate("2050-12-31")).toBe(false);
  });

  it("rechaza fechas calendario inválidas", () => {
    expect(isAllowedTaskDueDate("2027-02-30")).toBe(false);
    expect(isAllowedTaskDueDate("not-a-date")).toBe(false);
  });
});
