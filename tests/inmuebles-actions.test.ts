import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockRequireAdmin, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockPrisma: {
    inmueble: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

import {
  archivarInmueble,
  restaurarInmueble,
  editarInmueble,
  crearInmueble,
} from "@/app/inmuebles/actions";

const ADMIN = { id: "admin1", name: "Admin", role: "ADMIN" };
const ASESOR = { id: "asesor1", name: "Asesor", role: "ASESOR" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(ASESOR);
  mockRequireAdmin.mockResolvedValue(ADMIN);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
});

describe("inmuebles/actions — archivarInmueble", () => {
  it("ASESOR no puede archivar (requireAdmin redirige)", async () => {
    mockRequireAdmin.mockImplementation(() => {
      throw new Error("FORBIDDEN");
    });
    const fd = new FormData();
    fd.set("id", "i1");
    await expect(archivarInmueble({}, fd)).rejects.toThrow("FORBIDDEN");
    expect(mockPrisma.inmueble.update).not.toHaveBeenCalled();
  });

  it("ADMIN archiva correctamente", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ACTIVO",
      noInm: "100",
    });
    mockPrisma.inmueble.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "i1");
    const res = await archivarInmueble({}, fd);

    expect(res).toEqual({ ok: true });
    expect(mockPrisma.inmueble.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "i1" },
        data: expect.objectContaining({
          estado: "ARCHIVADO",
          updatedById: ADMIN.id,
        }),
      })
    );
    expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "INMUEBLE_ARCHIVADO",
          userId: ADMIN.id,
          inmuebleId: "i1",
        }),
      })
    );
  });

  it("rechaza si ya está archivado", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ARCHIVADO",
      noInm: "100",
    });
    const fd = new FormData();
    fd.set("id", "i1");
    const res = await archivarInmueble({}, fd);
    expect(res.error).toMatch(/ya está archivado/);
    expect(mockPrisma.inmueble.update).not.toHaveBeenCalled();
  });

  it("rechaza ID inválido", async () => {
    const fd = new FormData();
    fd.set("id", "");
    const res = await archivarInmueble({}, fd);
    expect(res.error).toBe("ID inválido");
  });
});

describe("inmuebles/actions — restaurarInmueble", () => {
  it("ADMIN restaura un archivado", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ARCHIVADO",
      noInm: "100",
    });
    mockPrisma.inmueble.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "i1");
    const res = await restaurarInmueble({}, fd);

    expect(res).toEqual({ ok: true });
    expect(mockPrisma.inmueble.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "ACTIVO" }),
      })
    );
  });

  it("rechaza si no está archivado", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ACTIVO",
      noInm: "100",
    });
    const fd = new FormData();
    fd.set("id", "i1");
    const res = await restaurarInmueble({}, fd);
    expect(res.error).toMatch(/no está archivado/);
  });
});

describe("inmuebles/actions — editarInmueble", () => {
  it("rechaza editar un inmueble archivado", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ARCHIVADO",
      noInm: "100",
    });
    const fd = new FormData();
    fd.set("noInm", "100");
    fd.set("direccion", "Nueva");
    const res = await editarInmueble("i1", {}, fd);
    expect(res.error).toMatch(/archivado/);
    expect(mockPrisma.inmueble.update).not.toHaveBeenCalled();
  });

  it("permite editar un inmueble activo", async () => {
    mockPrisma.inmueble.findUnique.mockResolvedValue({
      id: "i1",
      estado: "ACTIVO",
      noInm: "100",
    });
    mockPrisma.inmueble.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("noInm", "100");
    fd.set("direccion", "Nueva");
    await expect(editarInmueble("i1", {}, fd)).rejects.toThrow("REDIRECT");
    expect(mockPrisma.inmueble.update).toHaveBeenCalled();
  });
});

describe("inmuebles/actions — crearInmueble", () => {
  it("requiere noInm único", async () => {
    mockPrisma.inmueble.create.mockRejectedValue(
      Object.assign(new Error("P2002"), { code: "P2002" })
    );
    const fd = new FormData();
    fd.set("noInm", "100");
    const res = await crearInmueble({}, fd);
    expect(res.error).toMatch(/Ya existe|No\. Inm en uso/);
  });
});
