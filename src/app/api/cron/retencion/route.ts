import { NextRequest, NextResponse } from "next/server";
import { ejecutarPurgaRetencion } from "@/lib/retention";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleRetention(request);
}

export async function POST(request: NextRequest) {
  return handleRetention(request);
}

async function handleRetention(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron-retencion] CRON_SECRET no está configurado en el servidor");
    return NextResponse.json(
      { error: "Servicio no configurado" },
      { status: 500 }
    );
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  const isAuthorized = authHeader === expectedHeader;

  if (!isAuthorized) {
    console.warn("[cron-retencion] Intento de acceso no autorizado");
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const resultado = await ejecutarPurgaRetencion();
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("[cron-retencion] Error durante la purga de retención:", error);
    return NextResponse.json(
      { error: "Error procesando purga de retención" },
      { status: 500 }
    );
  }
}
