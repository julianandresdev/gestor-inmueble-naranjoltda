const BOGOTA_TZ_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: "America/Bogota",
};

export function formatDateTime(
  d: Date | string | null | undefined,
  fallback = "—",
): string {
  if (d == null) return fallback;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-CO", BOGOTA_TZ_OPTS);
}

export function formatDate(
  d: Date | string | null | undefined,
  fallback = "—",
): string {
  if (d == null) return fallback;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CO", BOGOTA_TZ_OPTS);
}