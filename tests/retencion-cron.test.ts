import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockEjecutarPurgaRetencion } = vi.hoisted(() => ({
  mockEjecutarPurgaRetencion: vi.fn(),
}));

vi.mock("@/lib/retention", () => ({
  ejecutarPurgaRetencion: mockEjecutarPurgaRetencion,
}));

import { GET, POST } from "@/app/api/cron/retencion/route";

describe("api/cron/retencion — Protección y Ejecución", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-cron-token-123";
    mockEjecutarPurgaRetencion.mockResolvedValue({
      actividadesEliminadas: 10,
      accesosEliminados: 5,
      sesionesEliminadas: 2,
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("rechaza peticiones sin encabezado Authorization con 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/retencion", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("No autorizado");
    expect(mockEjecutarPurgaRetencion).not.toHaveBeenCalled();
  });

  it("rechaza peticiones con token inválido con 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/retencion", {
      method: "GET",
      headers: {
        authorization: "Bearer wrong-token",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("No autorizado");
    expect(mockEjecutarPurgaRetencion).not.toHaveBeenCalled();
  });

  it("devuelve 500 si CRON_SECRET no está configurado", async () => {
    delete process.env.CRON_SECRET;

    const req = new NextRequest("http://localhost:3000/api/cron/retencion", {
      method: "GET",
      headers: {
        authorization: "Bearer some-token",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Servicio no configurado");
  });

  it("ejecuta la purga con éxito si el token es válido (GET)", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/retencion", {
      method: "GET",
      headers: {
        authorization: "Bearer super-secret-cron-token-123",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      actividadesEliminadas: 10,
      accesosEliminados: 5,
      sesionesEliminadas: 2,
    });
    expect(mockEjecutarPurgaRetencion).toHaveBeenCalledTimes(1);
  });

  it("ejecuta la purga con éxito vía POST también", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/retencion", {
      method: "POST",
      headers: {
        authorization: "Bearer super-secret-cron-token-123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockEjecutarPurgaRetencion).toHaveBeenCalledTimes(1);
  });
});
