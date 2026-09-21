"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { extractClientInfo } from "@/lib/client-info";
import { registrarPresencia } from "@/lib/audit";

export async function enviarLatido(
  sessionId: string,
  rutaActual: string
): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };

    const h = await headers();
    const info = extractClientInfo(h);

    await registrarPresencia({
      sessionId,
      userId: session.user.id,
      rutaActual: rutaActual.slice(0, 100),
      ip: info.ip,
      dispositivo: info.dispositivo,
      navegador: info.navegador,
      sistemaOperativo: info.sistemaOperativo,
    });

    return { ok: true };
  } catch (error) {
    console.error("[presencia] error registrando latido", error);
    return { ok: false };
  }
}
