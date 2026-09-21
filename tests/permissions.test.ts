import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  PERMISSIONS,
  canAccessPath,
  hasPermission,
  isAppRole,
  unauthorizedPath,
} from "@/lib/permissions";

describe("lib/permissions — isAppRole", () => {
  it("reconoce roles válidos", () => {
    for (const role of APP_ROLES) {
      expect(isAppRole(role)).toBe(true);
    }
  });

  it("rechaza roles inválidos o valores no-string", () => {
    expect(isAppRole("SUPERADMIN")).toBe(false);
    expect(isAppRole("")).toBe(false);
    expect(isAppRole(null)).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
    expect(isAppRole(123)).toBe(false);
  });
});

describe("lib/permissions — hasPermission", () => {
  it("ADMIN tiene todos los permisos", () => {
    for (const perm of PERMISSIONS) {
      expect(hasPermission("ADMIN", perm)).toBe(true);
    }
  });

  it("ASESOR tiene permisos de inmuebles, tareas, soporte y perfil, pero no administracion", () => {
    expect(hasPermission("ASESOR", "INMUEBLES_VIEW")).toBe(true);
    expect(hasPermission("ASESOR", "INMUEBLES_MANAGE")).toBe(true);
    expect(hasPermission("ASESOR", "TAREAS_GENERALES_VIEW")).toBe(true);
    expect(hasPermission("ASESOR", "TAREAS_GENERALES_MANAGE")).toBe(true);
    expect(hasPermission("ASESOR", "MANTENIMIENTO_CREATE")).toBe(true);
    expect(hasPermission("ASESOR", "SOPORTE_CREATE")).toBe(true);
    expect(hasPermission("ASESOR", "ADMINISTRACION_MANAGE")).toBe(false);
    expect(hasPermission("ASESOR", "MANTENIMIENTO_EXECUTE")).toBe(false);
  });

  it("MANTENIMIENTO solo accede a mantenimiento, soporte básico y perfil", () => {
    expect(hasPermission("MANTENIMIENTO", "MANTENIMIENTO_VIEW")).toBe(true);
    expect(hasPermission("MANTENIMIENTO", "MANTENIMIENTO_EXECUTE")).toBe(true);
    expect(hasPermission("MANTENIMIENTO", "SOPORTE_CREATE")).toBe(true);
    expect(hasPermission("MANTENIMIENTO", "PERFIL_VIEW")).toBe(true);
    expect(hasPermission("MANTENIMIENTO", "INMUEBLES_VIEW")).toBe(false);
    expect(hasPermission("MANTENIMIENTO", "TAREAS_GENERALES_VIEW")).toBe(false);
    expect(hasPermission("MANTENIMIENTO", "DASHBOARD_VIEW")).toBe(false);
    expect(hasPermission("MANTENIMIENTO", "ADMINISTRACION_MANAGE")).toBe(false);
  });

  it("rol inválido no tiene ningún permiso", () => {
    expect(hasPermission("ANONIMO", "PERFIL_VIEW")).toBe(false);
    expect(hasPermission(null, "PERFIL_VIEW")).toBe(false);
  });
});

describe("lib/permissions — unauthorizedPath", () => {
  it("redirige MANTENIMIENTO a /mantenimiento", () => {
    expect(unauthorizedPath("MANTENIMIENTO")).toBe("/mantenimiento");
  });

  it("redirige otros roles a /dashboard", () => {
    expect(unauthorizedPath("ASESOR")).toBe("/dashboard");
    expect(unauthorizedPath("ADMIN")).toBe("/dashboard");
  });
});

describe("lib/permissions — canAccessPath", () => {
  it("permite /login e /inicio a cualquiera", () => {
    expect(canAccessPath("ASESOR", "/login")).toBe(true);
    expect(canAccessPath("MANTENIMIENTO", "/login")).toBe(true);
    expect(canAccessPath(null, "/inicio")).toBe(true);
  });

  it("solo ADMIN puede acceder a /administracion", () => {
    expect(canAccessPath("ADMIN", "/administracion/usuarios")).toBe(true);
    expect(canAccessPath("ASESOR", "/administracion/usuarios")).toBe(false);
    expect(canAccessPath("MANTENIMIENTO", "/administracion/usuarios")).toBe(false);
  });

  it("MANTENIMIENTO no puede acceder a /dashboard, /inmuebles ni /tareas", () => {
    expect(canAccessPath("MANTENIMIENTO", "/dashboard")).toBe(false);
    expect(canAccessPath("MANTENIMIENTO", "/inmuebles")).toBe(false);
    expect(canAccessPath("MANTENIMIENTO", "/tareas")).toBe(false);
    expect(canAccessPath("MANTENIMIENTO", "/mantenimiento")).toBe(true);
    expect(canAccessPath("MANTENIMIENTO", "/perfil")).toBe(true);
  });

  it("ASESOR puede acceder a /dashboard, /inmuebles, /tareas, /mantenimiento, /soporte", () => {
    expect(canAccessPath("ASESOR", "/dashboard")).toBe(true);
    expect(canAccessPath("ASESOR", "/inmuebles/123")).toBe(true);
    expect(canAccessPath("ASESOR", "/tareas")).toBe(true);
    expect(canAccessPath("ASESOR", "/mantenimiento")).toBe(true);
    expect(canAccessPath("ASESOR", "/soporte")).toBe(true);
  });
});
