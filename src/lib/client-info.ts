import "server-only";
import { UAParser } from "ua-parser-js";

export type ClientInfo = {
  ip: string;
  dispositivo: string;
  navegador: string;
  sistemaOperativo: string;
  pais: string | null;
  ciudad: string | null;
  userAgent: string | null;
  resumenDispositivo: string;
};

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function extractClientInfo(headers: Headers): ClientInfo {
  const ip = extractClientIp(headers);
  const userAgent = headers.get("user-agent");
  const pais = headers.get("x-vercel-ip-country") || null;
  const ciudad = headers.get("x-vercel-ip-city") || null;

  const parser = new UAParser(userAgent || undefined);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const tipoDispositivo = device.type || "desktop";
  const nombreNavegador = browser.name ? `${browser.name}${browser.major ? ` ${browser.major}` : ""}` : "Desconocido";
  const nombreSO = os.name ? `${os.name}${os.version ? ` ${os.version}` : ""}` : "Desconocido";

  const resumenDispositivo = `${tipoDispositivo} · ${nombreNavegador} · ${nombreSO}`;

  return {
    ip,
    dispositivo: tipoDispositivo,
    navegador: nombreNavegador,
    sistemaOperativo: nombreSO,
    pais,
    ciudad,
    userAgent: userAgent || null,
    resumenDispositivo,
  };
}

export async function getClientInfoSafe(): Promise<ClientInfo | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return extractClientInfo(h);
  } catch {
    return null;
  }
}
