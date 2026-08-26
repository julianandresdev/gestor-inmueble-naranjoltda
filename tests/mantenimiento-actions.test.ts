import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAuth,
  mockRequireAdminOrAsesor,
  mockPrisma,
  mockWithTransaction,
  mockRegistrarActividad,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequireAdminOrAsesor: vi.fn(),
  mockPrisma: {
    tarea: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  mockWithTransaction: vi.fn(),
  mockRegistrarActividad: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  requireAuth: mockRequireAuth,
  requireAdminOrAsesor: mockRequireAdminOrAsesor,
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/audit", () => ({
  withTransaction: mockWithTransaction,
  registrarActividad: mockRegistrarActividad,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((u: string) => {
    throw new Error(`REDIRECT ${u}`);
  }),
}));

import {
  crearTareaMantenimiento,
  reclamarTareaMantenimiento,
  finalizarTareaMantenimiento,
  desreclamarTareaMantenimiento,
} from "@/app/mantenimiento/actions";

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
const MANTTO = {
  id: "mantto1",
  name: "Juan Pérez",
  username: "juan",
  role: "MANTENIMIENTO" as const,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockWithTransaction.mockImplementation(
    async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
  );
});

describe("mantenimiento/actions — crearTareaMantenimiento", () => {
  it("ADMIN puede crear y registra actividad MANTENIMIENTO_TAREA_CREADA", async () => {
    mockRequireAdminOrAsesor.mockResolvedValue(ADMIN);
    mockPrisma.tarea.create.mockResolvedValue({ id: "t1" });

    const fd = new FormData();
    fd.set("titulo", "Cambiar cerradura");
    fd.set("descripcion", "Llave rota");
    fd.set("inmuebleId", "inm1");
    fd.set("contacto", "ARRENDATARIO");
    fd.set("fechaLimite", "2026-12-01");

    await expect(crearTareaMantenimiento({}, fd)).rejects.toThrow(
      "REDIRECT /mantenimiento/t1"
    );

    expect(mockPrisma.tarea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: "Cambiar cerradura",
          descripcion: "Llave rota",
          inmuebleId: "inm1",
          contacto: "ARRENDATARIO",
          estado: "SIN_ASIGNAR",
          tipo: "MANTENIMIENTO",
          createdById: "admin1",
          assignedToId: null,
        }),
      })
    );

    expect(mockRegistrarActividad).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MANTENIMIENTO_TAREA_CREADA",
        entidad: "TAREA",
        userId: "admin1",
        context: "Cambiar cerradura",
      })
    );
  });

  it("ASESOR puede crear", async () => {
    mockRequireAdminOrAsesor.mockResolvedValue(ASESOR);
    mockPrisma.tarea.create.mockResolvedValue({ id: "t1" });

    const fd = new FormData();
    fd.set("titulo", "Limpieza");
    fd.set("inmuebleId", "");
    fd.set("contacto", "");
    fd.set("fechaLimite", "");

    await expect(crearTareaMantenimiento({}, fd)).rejects.toThrow(
      "REDIRECT /mantenimiento/t1"
    );
    expect(mockPrisma.tarea.create).toHaveBeenCalledTimes(1);
  });

  it("rechaza si titulo está vacío", async () => {
    mockRequireAdminOrAsesor.mockResolvedValue(ADMIN);
    const fd = new FormData();
    fd.set("titulo", "");
    fd.set("inmuebleId", "");

    const res = await crearTareaMantenimiento({}, fd);
    expect(res.fieldErrors?.titulo).toBeDefined();
    expect(mockPrisma.tarea.create).not.toHaveBeenCalled();
  });

  it("rechaza si hay inmueble y no se eligió contacto", async () => {
    mockRequireAdminOrAsesor.mockResolvedValue(ADMIN);

    const fd = new FormData();
    fd.set("titulo", "Limpieza");
    fd.set("inmuebleId", "inm1");
    fd.set("contacto", "");
    fd.set("fechaLimite", "");

    const res = await crearTareaMantenimiento({}, fd);
    expect(res.fieldErrors?.contacto).toBeDefined();
    expect(mockPrisma.tarea.create).not.toHaveBeenCalled();
  });

  it("registrarActividad falla → la transacción hace rollback y retorna error", async () => {
    mockRequireAdminOrAsesor.mockResolvedValue(ADMIN);
    mockPrisma.tarea.create.mockResolvedValue({ id: "t1" });
    mockRegistrarActividad.mockRejectedValue(new Error("boom"));

    const fd = new FormData();
    fd.set("titulo", "X");
    fd.set("inmuebleId", "");
    fd.set("contacto", "");
    fd.set("fechaLimite", "");

    const res = await crearTareaMantenimiento({}, fd);
    expect(res.error).toBeDefined();
  });
});

describe("mantenimiento/actions — reclamarTareaMantenimiento", () => {
  it("MANTENIMIENTO reclama una tarea SIN_ASIGNAR", async () => {
    mockRequireAuth.mockResolvedValue(MANTTO);
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 1 });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await reclamarTareaMantenimiento({}, fd);
    expect(res).toEqual({ ok: true });

    expect(mockPrisma.tarea.updateMany).toHaveBeenCalledWith({
      where: { id: "t1", tipo: "MANTENIMIENTO", estado: "SIN_ASIGNAR" },
      data: { estado: "EN_PROGRESO", assignedToId: "mantto1" },
    });
    expect(mockRegistrarActividad).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MANTENIMIENTO_TAREA_RECLAMADA",
        userId: "mantto1",
      })
    );
  });

  it("devuelve CONFLICT si count=0 (ya reclamada por otro)", async () => {
    mockRequireAuth.mockResolvedValue(MANTTO);
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 0 });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await reclamarTareaMantenimiento({}, fd);
    expect(res.error).toBe("La tarea ya fue reclamada por otro usuario");
    expect(mockRegistrarActividad).not.toHaveBeenCalled();
  });
});

describe("mantenimiento/actions — finalizarTareaMantenimiento", () => {
  it("asignado la finaliza", async () => {
    mockRequireAuth.mockResolvedValue(MANTTO);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "EN_PROGRESO",
      tipo: "MANTENIMIENTO",
    });
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 1 });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await finalizarTareaMantenimiento({}, fd);
    expect(res).toEqual({ ok: true });

    expect(mockRegistrarActividad).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MANTENIMIENTO_TAREA_FINALIZADA",
      })
    );
  });

  it("otro MANTENIMIENTO no puede finalizar → bloqueado", async () => {
    mockRequireAuth.mockResolvedValue({
      ...MANTTO,
      id: "mantto2",
      username: "otro",
    });
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "EN_PROGRESO",
      tipo: "MANTENIMIENTO",
    });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await finalizarTareaMantenimiento({}, fd);
    expect(res.error).toBe(
      "No tienes permisos para finalizar esta tarea"
    );
    expect(mockPrisma.tarea.updateMany).not.toHaveBeenCalled();
  });

  it("ADMIN puede finalizar tarea ajena", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "EN_PROGRESO",
      tipo: "MANTENIMIENTO",
    });
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 1 });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await finalizarTareaMantenimiento({}, fd);
    expect(res).toEqual({ ok: true });
  });

  it("rechaza si no está EN_PROGRESO", async () => {
    mockRequireAuth.mockResolvedValue(MANTTO);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "SIN_ASIGNAR",
      tipo: "MANTENIMIENTO",
    });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await finalizarTareaMantenimiento({}, fd);
    expect(res.error).toBe("Solo se puede finalizar una tarea en progreso");
    expect(mockPrisma.tarea.updateMany).not.toHaveBeenCalled();
  });
});

describe("mantenimiento/actions — desreclamarTareaMantenimiento", () => {
  it("asignado la desreclama", async () => {
    mockRequireAuth.mockResolvedValue(MANTTO);
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "EN_PROGRESO",
      tipo: "MANTENIMIENTO",
    });
    mockPrisma.tarea.updateMany.mockResolvedValue({ count: 1 });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await desreclamarTareaMantenimiento({}, fd);
    expect(res).toEqual({ ok: true });

    expect(mockRegistrarActividad).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MANTENIMIENTO_TAREA_LIBERADA",
      })
    );
  });

  it("no asignado no puede desreclamar", async () => {
    mockRequireAuth.mockResolvedValue({
      ...MANTTO,
      id: "mantto2",
      username: "otro",
    });
    mockPrisma.tarea.findUnique.mockResolvedValue({
      assignedToId: "mantto1",
      estado: "EN_PROGRESO",
      tipo: "MANTENIMIENTO",
    });

    const fd = new FormData();
    fd.set("id", "t1");

    const res = await desreclamarTareaMantenimiento({}, fd);
    expect(res.error).toBe(
      "No tienes permisos para desreclamar esta tarea"
    );
  });
});