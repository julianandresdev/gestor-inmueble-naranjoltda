import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockPrisma, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    soporteTicket: { findUnique: vi.fn() },
    soporteMensaje: { findMany: vi.fn() },
    actividad: { findMany: vi.fn() },
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

import {
  listSoporteMensajes,
  listarActividadSoporte,
  getSoporteTicket,
} from "@/lib/dal";

const OWNER = {
  id: "owner1",
  name: "Owner",
  username: "owner",
  role: "ASESOR" as const,
};
const ADMIN = {
  id: "admin1",
  name: "Admin",
  username: "admin",
  role: "ADMIN" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: OWNER });
  mockPrisma.soporteTicket.findUnique.mockResolvedValue({
    id: "t1",
    createdById: OWNER.id,
  });
  mockPrisma.soporteMensaje.findMany.mockResolvedValue([]);
  mockPrisma.actividad.findMany.mockResolvedValue([]);
});

describe("dal — listSoporteMensajes — control de acceso al ticket", () => {
  it("ASESOR autor del ticket puede leer los mensajes", async () => {
    mockPrisma.soporteMensaje.findMany.mockResolvedValue([
      {
        id: "m1",
        contenido: "Hola",
        createdAt: new Date(),
        autor: { id: OWNER.id, nombre: OWNER.name },
      },
    ]);

    const res = await listSoporteMensajes("t1");

    expect(res).toHaveLength(1);
    expect(mockPrisma.soporteMensaje.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ticketId: "t1" } })
    );
  });

  it("ASESOR ajeno al ticket NO puede leer los mensajes (redirige)", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "other1",
        name: "Other",
        username: "other",
        role: "ASESOR" as const,
      },
    });
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      createdById: OWNER.id,
    });

    await expect(listSoporteMensajes("t1")).rejects.toThrow("REDIRECT /soporte");
    expect(mockPrisma.soporteMensaje.findMany).not.toHaveBeenCalled();
  });

  it("ADMIN puede leer mensajes de cualquier ticket", async () => {
    mockAuth.mockResolvedValue({ user: ADMIN });

    const res = await listSoporteMensajes("t1");

    expect(res).toEqual([]);
    expect(mockPrisma.soporteMensaje.findMany).toHaveBeenCalled();
  });

  it("redirige a /soporte si el ticket no existe", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue(null);

    await expect(listSoporteMensajes("missing")).rejects.toThrow(
      "REDIRECT /soporte"
    );
    expect(mockPrisma.soporteMensaje.findMany).not.toHaveBeenCalled();
  });

  it("redirige a /login si no hay sesión", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(listSoporteMensajes("t1")).rejects.toThrow("REDIRECT /login");
    expect(mockPrisma.soporteTicket.findUnique).not.toHaveBeenCalled();
  });
});

describe("dal — listarActividadSoporte — control de acceso al ticket", () => {
  it("ASESOR autor del ticket puede leer la actividad", async () => {
    mockPrisma.actividad.findMany.mockResolvedValue([
      {
        id: "a1",
        tipo: "SOPORTE_CREADO",
        context: null,
        createdAt: new Date(),
        usuario: { nombre: OWNER.name },
      },
    ]);

    const res = await listarActividadSoporte("t1");

    expect(res).toHaveLength(1);
    expect(mockPrisma.actividad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { soporteTicketId: "t1" } })
    );
  });

  it("ASESOR ajeno al ticket NO puede leer la actividad (redirige)", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "other1",
        name: "Other",
        username: "other",
        role: "ASESOR" as const,
      },
    });
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      createdById: OWNER.id,
    });

    await expect(listarActividadSoporte("t1")).rejects.toThrow(
      "REDIRECT /soporte"
    );
    expect(mockPrisma.actividad.findMany).not.toHaveBeenCalled();
  });

  it("ADMIN puede leer actividad de cualquier ticket", async () => {
    mockAuth.mockResolvedValue({ user: ADMIN });

    await expect(listarActividadSoporte("t1")).resolves.toEqual([]);
    expect(mockPrisma.actividad.findMany).toHaveBeenCalled();
  });
});

describe("dal — getSoporteTicket — control de acceso al ticket", () => {
  it("ASESOR autor puede leer el detalle de su ticket", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValueOnce({
      id: "t1",
      createdById: OWNER.id,
    });
    mockPrisma.soporteTicket.findUnique.mockResolvedValueOnce({
      id: "t1",
      titulo: "Mi ticket",
      descripcion: "Detalle",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      creadoPor: { id: OWNER.id, nombre: OWNER.name },
      cerradoPor: null,
    });

    const res = await getSoporteTicket("t1");

    expect(res).not.toBeNull();
    expect(res?.id).toBe("t1");
  });

  it("ASESOR ajeno al ticket es redirigido", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "other1",
        name: "Other",
        username: "other",
        role: "ASESOR" as const,
      },
    });
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      createdById: OWNER.id,
    });

    await expect(getSoporteTicket("t1")).rejects.toThrow("REDIRECT /soporte");
  });
});