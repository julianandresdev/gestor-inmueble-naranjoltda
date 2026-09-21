const APP_TIME_ZONE = "America/Bogota";
const MAX_YEARS_AHEAD = 5;

function todayInTimeZone(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function addYears(dateValue: string, years: number): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isAllowedTaskDueDate(value: string): boolean {
  if (!isRealIsoDate(value)) return false;
  const today = todayInTimeZone();
  return value >= today && value <= addYears(today, MAX_YEARS_AHEAD);
}

export const TASK_DUE_DATE_ERROR =
  "La fecha límite debe ser válida y estar entre hoy y 5 años en el futuro";
