export const APP_ROLES = ["ADMIN", "ASESOR", "MANTENIMIENTO"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = [
  "DASHBOARD_VIEW",
  "INMUEBLES_VIEW",
  "INMUEBLES_MANAGE",
  "TAREAS_GENERALES_VIEW",
  "TAREAS_GENERALES_MANAGE",
  "MANTENIMIENTO_VIEW",
  "MANTENIMIENTO_CREATE",
  "MANTENIMIENTO_EXECUTE",
  "MANTENIMIENTO_SUPERVISE",
  "SOPORTE_CREATE",
  "SOPORTE_COMMENT_OWN",
  "SOPORTE_MANAGE",
  "PERFIL_VIEW",
  "ADMINISTRACION_MANAGE",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const rolePermissions: Record<AppRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  ASESOR: [
    "DASHBOARD_VIEW",
    "INMUEBLES_VIEW",
    "INMUEBLES_MANAGE",
    "TAREAS_GENERALES_VIEW",
    "TAREAS_GENERALES_MANAGE",
    "MANTENIMIENTO_VIEW",
    "MANTENIMIENTO_CREATE",
    "SOPORTE_CREATE",
    "SOPORTE_COMMENT_OWN",
    "PERFIL_VIEW",
  ],
  MANTENIMIENTO: [
    "MANTENIMIENTO_VIEW",
    "MANTENIMIENTO_EXECUTE",
    "SOPORTE_CREATE",
    "SOPORTE_COMMENT_OWN",
    "PERFIL_VIEW",
  ],
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function hasPermission(role: unknown, permission: Permission): boolean {
  return isAppRole(role) && rolePermissions[role].includes(permission);
}

export function unauthorizedPath(role: unknown): string {
  return role === "MANTENIMIENTO" ? "/mantenimiento" : "/dashboard";
}

export function canAccessPath(role: unknown, path: string): boolean {
  if (path === "/perfil") return hasPermission(role, "PERFIL_VIEW");
  if (path === "/login" || path === "/inicio") return true;
  if (path === "/terminos" || path === "/privacidad") return true;
  if (path === "/dashboard") return hasPermission(role, "DASHBOARD_VIEW");
  if (path.startsWith("/inmuebles")) return hasPermission(role, "INMUEBLES_VIEW");
  if (path.startsWith("/tareas")) return hasPermission(role, "TAREAS_GENERALES_VIEW");
  if (path.startsWith("/mantenimiento")) return hasPermission(role, "MANTENIMIENTO_VIEW");
  if (path.startsWith("/soporte")) return hasPermission(role, "SOPORTE_CREATE");
  if (path.startsWith("/administracion")) {
    return hasPermission(role, "ADMINISTRACION_MANAGE");
  }
  return false;
}
