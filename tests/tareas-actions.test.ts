import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAuth,
  mockRequireAdmin,
  mockPrisma,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockPrisma: {
    tarea: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    inmueble: {
      findUnique: vi.fn(),
    },
    usuario: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
    actividad: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/dal", () => ({
  requireAuth: mockRequireAuth,
  requireAdmin: mockRequireAdmin,
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((u: string) => {
    throw new Error(`REDIRECT ${u}`);
  }),
}));

import { crearTarea, reclamarTarea, liberarTarea, completarTarea } from "@/app/tareas/actions";

const ADMIN = { id: "admin1", name: "Admin", role: "ADMIN" };
const ASESOR = { id: "asesor1", name: "Asesor", role: "ASESOR" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(ASESOR);
  mockRequireAdmin.mockResolvedValue(ADMIN);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
  // Re-apply specific mock implementations after clearAllMocks
  // (clearAllMocks wipes .mockReturnValue but the tests re-set them per-it).
});

describe("tareas/actions — crearTarea", () => {
  it("crea tarea general como SIN_ASIGNAR y sin responsable", async () => {
    mockPrisma.tarea.create.mockResolvedValue({ id: "t1" });

    const fd = new FormData();
    fd.set("titulo", "Mi tarea");

    await expect(crearTarea({}, fd)).rejects.toThrow("REDIRECT");

    expect(mockPrisma.tarea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: "Mi tarea",
          estado: "SIN_ASIGNAR",
          assignedToId: null,
          createdById: ASESOR.id,
        }),
      })
    );
    expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "TAREA_CREADA",
          userId: ASESOR.id,
          tareaId: "t1",
        }),
      })
    );
  });
});

describe("tareas/actions — reclamarTarea", () => {
  it("reclama correctamente si la tarea está SIN_ASIGNAR", async () => {
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 1 });

    const fd = new FormData();
    fd.set("id", "t1");
    const res = await reclamarTarea({}, fd);

    expect(mockPrisma.tarea.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1", estado: "SIN_ASIGNAR" },
        data: expect.objectContaining({
          estado: "EN_PROGRESO",
          assignedToId: ASESOR.id,
        }),
      })
    );
    expect(res).toEqual({ ok: true });
  });

  it("rechaza si la tarea ya está reclamada por otro", async () => {
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 0 });

    const fd = new FormData();
    fd.set("id", "t1");
    const res = await reclamarTarea({}, fd);

    expect(res.error).toMatch(/ya fue reclamada por otro usuario/);
    expect(mockPrisma.actividad.create).not.toHaveBeenCalled();
  });

  it("rechaza ID inválido", async () => {
    const fd = new FormData();
    fd.set("id", "");
    const res = await reclamarTarea({}, fd);
    expect(res.error).toBe("ID inválido");
  });
});

describe("tareas/actions — liberarTarea", () => {
  it("permite liberar al responsable", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: ASESOR.id,
    });
    mockPrisma.tarea.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    const res = await liberarTarea({}, fd);
    expect(res).toEqual({ ok: true });
    expect(mockPrisma.tarea.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: { estado: "SIN_ASIGNAR", assignedToId: null },
      })
    );
  });

  it("rechaza si la tarea no está en progreso", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "SIN_ASIGNAR",
      assignedToId: null,
    });
    const fd = new FormData();
    fd.set("id", "t1");
    const res = await liberarTarea({}, fd);
    expect(res.error).toMatch(/solo se puede liberar/i);
    expect(mockPrisma.tarea.update).not.toHaveBeenCalled();
  });

  it("rechaza si el usuario no es el responsable y no es ADMIN", async () => {
    mockRequireAuth.mockResolvedValue(ASESOR);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: "otroUsuario",
    });
    const fd = new FormData();
    fd.set("id", "t1");
    const res = await liberarTarea({}, fd);
    expect(res.error).toMatch(/permisos/);
    expect(mockPrisma.tarea.update).not.toHaveBeenCalled();
  });

  it("permite a ADMIN liberar tarea de otro", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: "otroUsuario",
    });
    mockPrisma.tarea.update.mockResolvedValue({});
    const fd = new FormData();
    fd.set("id", "t1");
    const res = await liberarTarea({}, fd);
    expect(res).toEqual({ ok: true });
  });
});

describe("tareas/actions — completarTarea", () => {
  it("NO permite a usuario normal completar tarea de otro", async () => {
    mockRequireAuth.mockResolvedValue(ASESOR);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: "otroUsuario",
    });
    const fd = new FormData();
    fd.set("id", "t1");
    const res = await completarTarea({}, fd);
    expect(res.error).toMatch(/permisos/);
    expect(mockPrisma.tarea.update).not.toHaveBeenCalled();
  });

  it("permite a ADMIN completar tarea de otro", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: "otroUsuario",
    });
    mockPrisma.tarea.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    const res = await completarTarea({}, fd);

    expect(res).toEqual({ ok: true });
    expect(mockPrisma.tarea.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "COMPLETADA",
          completedAt: expect.any(Date),
        }),
      })
    );
  });

  it("registra completedAt solo al completar", async () => {
    mockRequireAuth.mockResolvedValue(ASESOR);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "EN_PROGRESO",
      assignedToId: ASESOR.id,
    });
    mockPrisma.tarea.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "t1");
    await completarTarea({}, fd);

    expect(mockPrisma.tarea.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "COMPLETADA",
          completedAt: expect.any(Date),
        }),
      })
    );
  });

  it("rechaza si la tarea no está en progreso", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValue({
      estado: "SIN_ASIGNAR",
      assignedToId: null,
    });
    const fd = new FormData();
    fd.set("id", "t1");
    const res = await completarTarea({}, fd);
    expect(res.error).toBeDefined();
  });
});
