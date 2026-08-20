import "server-only";

export type TicketAccion =
  | "creado"
  | "en_progreso"
  | "resuelto"
  | "cerrado"
  | "cancelado"
  | "comentado";

export type TicketNotificacion = {
  ticketId: string;
  titulo: string;
  estado: string;
  prioridad: string;
  autor: string;
  detalle?: string | null;
  accion: TicketAccion;
  url?: string;
};

export type SendResult = { ok: boolean; error?: string };

const TIMEOUT_MS = 5000;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return {
    token: token && token.trim() && token !== "tu-token" ? token : null,
    chatId: chatId && chatId.trim() && chatId !== "tu-id" ? chatId : null,
  };
}

export const PRIORIDAD_EMOJI: Record<string, string> = {
  BAJA: "🟢",
  NORMAL: "🔵",
  ALTA: "🟠",
  URGENTE: "🔴",
};

export const ESTADO_EMOJI: Record<string, string> = {
  ABIERTO: "🆕",
  EN_PROGRESO: "⏳",
  RESUELTO: "✅",
  CERRADO: "🔒",
  CANCELADO: "❌",
};

export const ACCION_EMOJI: Record<TicketAccion, string> = {
  creado: "📩",
  en_progreso: "⏳",
  resuelto: "✅",
  cerrado: "🔒",
  cancelado: "❌",
  comentado: "💬",
};

export function formatTicketMessage(t: TicketNotificacion): string {
  const accionEmoji = ACCION_EMOJI[t.accion];
  const estadoEmoji = ESTADO_EMOJI[t.estado] ?? "•";
  const prioridadEmoji = PRIORIDAD_EMOJI[t.prioridad] ?? "•";

  const lines: string[] = [];
  lines.push(`<b>${accionEmoji} Ticket · ${escapeHtml(t.accion)}</b>`);
  lines.push("");
  lines.push(`<b>${escapeHtml(t.titulo)}</b>`);
  lines.push("");
  lines.push(
    `${estadoEmoji} ${escapeHtml(t.estado)} · ${prioridadEmoji} ${escapeHtml(t.prioridad)}`
  );
  lines.push(`<b>Autor:</b> ${escapeHtml(t.autor)}`);
  if (t.detalle) {
    lines.push("");
    lines.push(escapeHtml(t.detalle));
  }
  if (t.url) {
    lines.push("");
    lines.push(`<a href="${escapeHtml(t.url)}">👉 Abrir ticket</a>`);
  }
  return lines.join("\n");
}

export async function sendTelegramMessage(
  text: string,
): Promise<SendResult> {
  const { token, chatId } = getTelegramConfig();
  if (!token || !chatId) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados; omitiendo envío."
    );
    return { ok: false, error: "TELEGRAM_NOT_CONFIGURED" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[telegram] HTTP ${res.status} al enviar mensaje: ${body.slice(0, 300)}`
      );
      return { ok: false, error: `HTTP_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[telegram] Error al enviar mensaje: ${msg}`);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function notifyTicket(
  ticket: TicketNotificacion
): Promise<SendResult> {
  const text = formatTicketMessage(ticket);
  return sendTelegramMessage(text);
}
