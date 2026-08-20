import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockNotifyTicket, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockNotifyTicket: vi.fn(),
  mockPrisma: {
    soporteTicket: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    soporteMensaje: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    usuario: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
    actividad: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/dal", () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/telegram", () => ({
  notifyTicket: mockNotifyTicket,
  formatTicketMessage: (t: unknown) => JSON.stringify(t),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((u: string) => {
    throw new Error(`REDIRECT ${u}`);
  }),
}));

import {
  agregarMensajeSoporte,
  cambiarEstadoSoporteTicket,
  cambiarPrioridadSoporteTicket,
  crearSoporteTicket,
} from "@/app/soporte/actions";

const ADMIN = { id: "admin1", name: "Admin", role: "ADMIN" };
const ASESOR = { id: "asesor1", name: "Asesor", role: "ASESOR" };
const OTRO = { id: "otro1", name: "Otro", role: "ASESOR" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(ASESOR);
  mockNotifyTicket.mockResolvedValue({ ok: true });
  mockPrisma.$transaction.mockImplementation(
    async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
  );
  mockPrisma.soporteTicket.findUnique.mockResolvedValue({
    id: "t1",
    titulo: "Test",
    estado: "ABIERTO",
    prioridad: "NORMAL",
    createdById: ASESOR.id,
    creadoPor: { nombre: "Asesor" },
  } as never);
});

describe("soporte/actions — crearSoporteTicket", () => {
  it("crea ticket como ABIERTO y notifica a Telegram", async () => {
    mockPrisma.soporteTicket.create.mockResolvedValue({ id: "t1" });

    const fd = new FormData();
    fd.set("titulo", "No funciona X");
    fd.set("descripcion", "Detalle del problema");
    fd.set("prioridad", "ALTA");

    await expect(crearSoporteTicket({}, fd)).rejects.toThrow("REDIRECT");

    expect(mockPrisma.soporteTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: "No funciona X",
          descripcion: "Detalle del problema",
          prioridad: "ALTA",
          estado: "ABIERTO",
          createdById: ASESOR.id,
        }),
      })
    );
    expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "SOPORTE_CREADO",
          soporteTicketId: "t1",
          userId: ASESOR.id,
        }),
      })
    );
    expect(mockNotifyTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "t1",
        accion: "creado",
        titulo: "Test",
      })
    );
  });

  it("rechaza título vacío", async () => {
    const fd = new FormData();
    fd.set("titulo", "");
    fd.set("descripcion", "Algo");
    const res = await crearSoporteTicket({}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.soporteTicket.create).not.toHaveBeenCalled();
  });

  it("rechaza descripción vacía", async () => {
    const fd = new FormData();
    fd.set("titulo", "Ok");
    fd.set("descripcion", "");
    const res = await crearSoporteTicket({}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.soporteTicket.create).not.toHaveBeenCalled();
  });
});

describe("soporte/actions — cambiarEstadoSoporteTicket", () => {
  it("permite al autor cambiar ABIERTO → EN_PROGRESO", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: ASESOR.id,
      creadoPor: { nombre: "Asesor" },
    });
    mockPrisma.soporteTicket.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("estado", "EN_PROGRESO");

    const res = await cambiarEstadoSoporteTicket({}, fd);
    expect(res).toEqual({ ok: true });
    expect(mockNotifyTicket).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "en_progreso" })
    );
  });

  it("permite a ADMIN cambiar estado de un ticket ajeno", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: "otroUser",
      creadoPor: { nombre: "Otro" },
    });
    mockPrisma.soporteTicket.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("estado", "EN_PROGRESO");

    const res = await cambiarEstadoSoporteTicket({}, fd);
    expect(res).toEqual({ ok: true });
  });

  it("rechaza a ASESOR sobre ticket ajeno", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: OTRO.id,
      creadoPor: { nombre: "Otro" },
    });

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("estado", "EN_PROGRESO");

    const res = await cambiarEstadoSoporteTicket({}, fd);
    expect(res.error).toMatch(/permisos/);
    expect(mockPrisma.soporteTicket.update).not.toHaveBeenCalled();
  });

  it("rechaza transición inválida", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "CERRADO",
      prioridad: "NORMAL",
      createdById: ASESOR.id,
      creadoPor: { nombre: "Asesor" },
    });

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("estado", "RESUELTO");

    const res = await cambiarEstadoSoporteTicket({}, fd);
    expect(res.error).toMatch(/Transición inválida/);
    expect(mockPrisma.soporteTicket.update).not.toHaveBeenCalled();
  });

  it("establece resolvedAt al pasar a RESUELTO", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "EN_PROGRESO",
      prioridad: "NORMAL",
      createdById: ASESOR.id,
      creadoPor: { nombre: "Asesor" },
    });
    mockPrisma.soporteTicket.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("estado", "RESUELTO");

    await cambiarEstadoSoporteTicket({}, fd);
    expect(mockPrisma.soporteTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTO",
          resolvedAt: expect.any(Date),
        }),
      })
    );
  });
});

describe("soporte/actions — agregarMensajeSoporte", () => {
  it("crea mensaje y notifica al autor", async () => {
    mockPrisma.soporteMensaje.create.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("contenido", "Probemos X");

    const res = await agregarMensajeSoporte({}, fd);
    expect(res).toEqual({ ok: true });
    expect(mockPrisma.soporteMensaje.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contenido: "Probemos X",
          ticketId: "t1",
          authorId: ASESOR.id,
        }),
      })
    );
    expect(mockNotifyTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "comentado",
        detalle: "Probemos X",
      })
    );
  });

  it("rechaza a ASESOR comentar ticket ajeno", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: OTRO.id,
      creadoPor: { nombre: "Otro" },
    });

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("contenido", "Hola");

    const res = await agregarMensajeSoporte({}, fd);
    expect(res.error).toMatch(/permisos/);
    expect(mockPrisma.soporteMensaje.create).not.toHaveBeenCalled();
  });

  it("permite a ADMIN comentar ticket ajeno", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: OTRO.id,
      creadoPor: { nombre: "Otro" },
    });
    mockPrisma.soporteMensaje.create.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("contenido", "Te ayudo");

    const res = await agregarMensajeSoporte({}, fd);
    expect(res).toEqual({ ok: true });
  });

  it("rechaza contenido vacío", async () => {
    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("contenido", "   ");

    const res = await agregarMensajeSoporte({}, fd);
    expect(res.error).toMatch(/vacío/i);
  });
});

describe("soporte/actions — cambiarPrioridadSoporteTicket", () => {
  it("permite al autor cambiar la prioridad y notifica", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: ASESOR.id,
      creadoPor: { nombre: "Asesor" },
    });
    mockPrisma.soporteTicket.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "URGENTE");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res).toEqual({ ok: true });
    expect(mockPrisma.soporteTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: { prioridad: "URGENTE" },
      })
    );
    expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "SOPORTE_PRIORIDAD",
          context: "Prioridad NORMAL → URGENTE",
          soporteTicketId: "t1",
        }),
      })
    );
    expect(mockNotifyTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        detalle: "Prioridad NORMAL → URGENTE",
      })
    );
  });

  it("no hace nada si la prioridad ya es la misma", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "ALTA",
      createdById: ASESOR.id,
      creadoPor: { nombre: "Asesor" },
    });

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "ALTA");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res).toEqual({ ok: true });
    expect(mockPrisma.soporteTicket.update).not.toHaveBeenCalled();
  });

  it("permite a ADMIN cambiar prioridad de un ticket ajeno", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "BAJA",
      createdById: OTRO.id,
      creadoPor: { nombre: "Otro" },
    });
    mockPrisma.soporteTicket.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "URGENTE");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res).toEqual({ ok: true });
  });

  it("rechaza a ASESOR sobre ticket ajeno", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue({
      id: "t1",
      titulo: "Test",
      estado: "ABIERTO",
      prioridad: "NORMAL",
      createdById: OTRO.id,
      creadoPor: { nombre: "Otro" },
    });

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "URGENTE");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res.error).toMatch(/permisos/);
    expect(mockPrisma.soporteTicket.update).not.toHaveBeenCalled();
  });

  it("rechaza prioridad inválida", async () => {
    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "INVALIDA");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.soporteTicket.update).not.toHaveBeenCalled();
  });

  it("rechaza si el ticket no existe", async () => {
    mockPrisma.soporteTicket.findUnique.mockResolvedValue(null);

    const fd = new FormData();
    fd.set("id", "t1");
    fd.set("prioridad", "URGENTE");

    const res = await cambiarPrioridadSoporteTicket({}, fd);
    expect(res.error).toMatch(/no encontrado/);
  });
});
