import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockPrisma } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockPrisma: {
    usuario: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/dal", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  crearUsuario,
  editarUsuario,
} from "@/app/administracion/usuarios/actions";

const ADMIN = { id: "admin1", name: "Admin", role: "ADMIN" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue(ADMIN);
});

describe("administracion/usuarios/actions — crearUsuario", () => {
  it("requiere username único", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({ id: "existing" });
    mockPrisma.usuario.create.mockResolvedValue({ id: "u1" });

    const fd = new FormData();
    fd.set("nombre", "Test");
    fd.set("username", "nuevo");
    fd.set("password", "secreto123");
    fd.set("confirmPassword", "secreto123");
    fd.set("rol", "ASESOR");

    const res = await crearUsuario({}, fd);
    expect(res.error).toBeDefined();
    expect(res.fieldErrors?.username).toBe("Usuario en uso");
    expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
  });

  it("rechaza contraseña muy corta", async () => {
    const fd = new FormData();
    fd.set("nombre", "Test");
    fd.set("username", "nuevo");
    fd.set("password", "123");
    fd.set("confirmPassword", "123");
    fd.set("rol", "ASESOR");
    const res = await crearUsuario({}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas que no coinciden", async () => {
    const fd = new FormData();
    fd.set("nombre", "Test");
    fd.set("username", "nuevo");
    fd.set("password", "secreto123");
    fd.set("confirmPassword", "secreto456");
    fd.set("rol", "ASESOR");
    const res = await crearUsuario({}, fd);
    expect(res.fieldErrors?.confirmPassword).toBe(
      "Las contraseñas no coinciden"
    );
    expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
  });

  it("crea usuario con hash (no guarda contraseña en claro)", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    mockPrisma.usuario.create.mockResolvedValue({ id: "u1" });

    const fd = new FormData();
    fd.set("nombre", "Test");
    fd.set("username", "nuevo");
    fd.set("password", "secreto123");
    fd.set("confirmPassword", "secreto123");
    fd.set("rol", "ASESOR");

    const res = await crearUsuario({}, fd);
    expect(res).toEqual({ ok: true });
    const call = mockPrisma.usuario.create.mock.calls[0][0];
    expect(call.data.passwordHash).not.toContain("secreto123");
    expect(call.data.passwordHash.length).toBeGreaterThan(20);
    expect(call.data.confirmPassword).toBeUndefined();
  });
});

describe("administracion/usuarios/actions — editarUsuario", () => {
  it("ADMIN no puede cambiar su propio rol", async () => {
    mockPrisma.usuario.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", ADMIN.id);
    fd.set("nombre", "Admin");
    fd.set("username", "admin");
    fd.set("rol", "ASESOR");

    const res = await editarUsuario({}, fd);
    expect(res.error).toBe("No puedes cambiar tu propio rol");
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
  });

  it("ADMIN puede editar a otro ADMIN sin cambiar rol", async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue(null);
    mockPrisma.usuario.update.mockResolvedValue({});

    const fd = new FormData();
    fd.set("id", "otroAdmin");
    fd.set("nombre", "Otro");
    fd.set("username", "otroadmin");
    fd.set("rol", "ADMIN");

    const res = await editarUsuario({}, fd);
    expect(res).toEqual({ ok: true });
  });

  it("rechaza username duplicado en edición", async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: "otro" });

    const fd = new FormData();
    fd.set("id", "u1");
    fd.set("nombre", "Test");
    fd.set("username", "tomado");
    fd.set("rol", "ASESOR");

    const res = await editarUsuario({}, fd);
    expect(res.fieldErrors?.username).toBe("Usuario en uso");
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
  });
});
