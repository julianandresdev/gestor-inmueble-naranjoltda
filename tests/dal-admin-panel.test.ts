import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockPrisma, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    tarea: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    registroAcceso: { findMany: vi.fn(), groupBy: vi.fn() },
    inmueble: { count: vi.fn(), groupBy: vi.fn() },
    soporteTicket: { count: vi.fn(), groupBy: vi.fn() },
    sesionPresencia: { findMany: vi.fn() },
    usuario: { findMany: vi.fn(), count: vi.fn() },
    actividad: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
  },
  mockRedirect: vi.fn((url: string) => {
    const err = new Error(`REDIRECT ${url}`);
    (err as Error & { __isRedirect: true }).__isRedirect = true;
    throw err;
  }),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});
vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

import { getAdminPanelData } from "@/lib/dal-admin-panel";

const ADMIN = {
  id: "admin1",
  name: "Admin",
  username: "admin",
  role: "ADMIN" as const,
};

const ASESOR = {
  id: "asesor1",
  name: "Asesor",
  username: "asesor",
  role: "ASESOR" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: ADMIN });

  mockPrisma.tarea.findMany.mockResolvedValue([]);
  mockPrisma.tarea.count.mockResolvedValue(5);
  mockPrisma.tarea.groupBy.mockResolvedValue([]);

  mockPrisma.registroAcceso.findMany.mockResolvedValue([]);
  mockPrisma.registroAcceso.groupBy.mockResolvedValue([]);

  mockPrisma.inmueble.count.mockResolvedValue(10);
  mockPrisma.inmueble.groupBy.mockResolvedValue([
    { estado: "ACTIVO", _count: { id: 25 } },
    { estado: "ARCHIVADO", _count: { id: 5 } },
  ]);

  mockPrisma.soporteTicket.count.mockResolvedValue(2);
  mockPrisma.soporteTicket.groupBy.mockResolvedValue([]);

  mockPrisma.sesionPresencia.findMany.mockResolvedValue([
    {
      id: "sp1",
      userId: "admin1",
      sessionId: "sess1",
      dispositivo: "desktop",
      navegador: "Chrome",
      sistemaOperativo: "macOS",
      ip: "186.84.90.12",
      rutaActual: "/administracion/panel",
      ultimaActividad: new Date(),
      usuario: { id: "admin1", nombre: "Admin", username: "admin", rol: "ADMIN" },
    },
  ]);

  mockPrisma.usuario.findMany.mockResolvedValue([
    { id: "admin1", nombre: "Admin", username: "admin", rol: "ADMIN" },
  ]);
  mockPrisma.usuario.count.mockResolvedValue(3);

  mockPrisma.actividad.findMany.mockResolvedValue([
    {
      userId: "admin1",
      tipo: "INMUEBLE_CREADO",
      entidad: "INMUEBLE",
      createdAt: new Date(),
    },
  ]);
  mockPrisma.actividad.groupBy.mockResolvedValue([
    { entidad: "INMUEBLE", _count: { id: 1 } },
  ]);
  mockPrisma.actividad.count.mockResolvedValue(1);
});

describe("dal-admin-panel — Control de Acceso", () => {
  it("permite el acceso si el rol es ADMIN", async () => {
    mockAuth.mockResolvedValue({ user: ADMIN });
    const data = await getAdminPanelData("7d");

    expect(data).toBeDefined();
    expect(data.periodo).toBe("7d");
    expect(data.kpis.inmuebles.activos).toBe(25);
    expect(data.kpis.inmuebles.archivados).toBe(5);
    expect(data.kpis.inmuebles.total).toBe(30);
    expect(data.equipo.conectados).toHaveLength(1);
    expect(data.equipo.conectados[0].nombre).toBe("Admin");
  });

  it("rechaza y redirige a /dashboard si el rol es ASESOR", async () => {
    mockAuth.mockResolvedValue({ user: ASESOR });

    await expect(getAdminPanelData("7d")).rejects.toThrow("REDIRECT /dashboard");
  });

  it("rechaza y redirige a /login si no hay sesión autenticada", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(getAdminPanelData("7d")).rejects.toThrow("REDIRECT /login");
  });
});

describe("dal-admin-panel — Procesamiento de Alertas y Métricas", () => {
  it("detecta alertas de tareas vencidas > 3 días", async () => {
    const fechaVencida = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    mockPrisma.tarea.findMany.mockImplementation((args: any) => {
      if (args?.where?.fechaLimite) {
        return Promise.resolve([
          {
            id: "t-vencida-1",
            titulo: "Llamar cliente urgente",
            fechaLimite: fechaVencida,
            tipo: "GENERAL",
            asignadaA: { nombre: "Carlos Asesor" },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const data = await getAdminPanelData("hoy");
    expect(data.periodo).toBe("hoy");
    expect(data.alertas.tareasVencidas).toHaveLength(1);
    expect(data.alertas.tareasVencidas[0].titulo).toBe("Llamar cliente urgente");
    expect(data.alertas.tareasVencidas[0].diasVencida).toBeGreaterThanOrEqual(4);
    expect(data.alertas.tareasVencidas[0].asignadoA).toBe("Carlos Asesor");
  });

  it("detecta alertas de intentos fallidos repetidos (>= 3 intentos en 24h)", async () => {
    mockPrisma.registroAcceso.findMany.mockImplementation((args: any) => {
      if (args?.where?.tipo === "LOGIN_FALLIDO") {
        return Promise.resolve([
          {
            ip: "190.24.55.10",
            username: "admin",
            ciudad: "Bogotá",
            pais: "CO",
            createdAt: new Date(),
          },
          {
            ip: "190.24.55.10",
            username: "admin",
            ciudad: "Bogotá",
            pais: "CO",
            createdAt: new Date(),
          },
          {
            ip: "190.24.55.10",
            username: "admin",
            ciudad: "Bogotá",
            pais: "CO",
            createdAt: new Date(),
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const data = await getAdminPanelData("30d");
    expect(data.periodo).toBe("30d");
    expect(data.alertas.intentosFallidosSospechosos).toHaveLength(2);
    const ipAlert = data.alertas.intentosFallidosSospechosos.find((a) => a.tipo === "IP");
    const userAlert = data.alertas.intentosFallidosSospechosos.find((a) => a.tipo === "USUARIO");
    expect(ipAlert?.identificador).toBe("190.24.55.10");
    expect(ipAlert?.totalFallos).toBe(3);
    expect(userAlert?.identificador).toBe("admin");
    expect(userAlert?.totalFallos).toBe(3);
  });
});
