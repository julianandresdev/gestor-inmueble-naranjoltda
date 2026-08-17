import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockPrisma: {
    nota: { create: vi.fn() },
    inmueble: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    actividad: { create: vi.fn() },
  },
}));

vi.mock("@/lib/dal", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { crearNota } from "@/app/inmuebles/[id]/actions";

const USER = { id: "u1", name: "U", role: "ASESOR" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(USER);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
});

describe("[inmuebleId]/actions — crearNota", () => {
  it("crea nota en inmueble activo", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ACTIVO",
      noInm: "100",
    });
    mockPrisma.nota.create.mockResolvedValue({ id: "n1" });

    const fd = new FormData();
    fd.set("contenido", "Hola");
    const res = await crearNota("i1", {}, fd);

    expect(res).toEqual({ ok: true });
    expect(mockPrisma.nota.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contenido: "Hola",
          inmuebleId: "i1",
          authorId: USER.id,
        }),
      })
    );
    expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "NOTA_CREADA",
          inmuebleId: "i1",
        }),
      })
    );
  });

  it("rechaza nota en inmueble archivado", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ARCHIVADO",
      noInm: "100",
    });
    const fd = new FormData();
    fd.set("contenido", "Hola");
    const res = await crearNota("i1", {}, fd);
    expect(res.error).toMatch(/archivado/);
    expect(mockPrisma.nota.create).not.toHaveBeenCalled();
  });

  it("rechaza contenido vacío", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ACTIVO",
      noInm: "100",
    });
    const fd = new FormData();
    fd.set("contenido", "");
    const res = await crearNota("i1", {}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.nota.create).not.toHaveBeenCalled();
  });
});
