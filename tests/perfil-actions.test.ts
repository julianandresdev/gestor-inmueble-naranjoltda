import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAuth,
  mockPrisma,
  mockWithTransaction,
  mockSignOut,
  mockRegistrarActividad,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockPrisma: {
    usuario: {
      update: vi.fn(),
    },
  },
  mockWithTransaction: vi.fn(),
  mockSignOut: vi.fn(),
  mockRegistrarActividad: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/auth", () => ({
  signOut: mockSignOut.mockImplementation(() => {
    throw new Error("REDIRECT /login");
  }),
}));
vi.mock("@/lib/audit", () => ({
  withTransaction: mockWithTransaction,
  registrarActividad: mockRegistrarActividad,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { cambiarMiContrasena } from "@/app/perfil/actions";

const USER = { id: "u1", name: "Test", username: "test", role: "ASESOR" };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(USER);
  mockPrisma.usuario.update.mockResolvedValue({ id: USER.id });
  mockWithTransaction.mockImplementation(
    async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
  );
});

describe("perfil/actions — cambiarMiContrasena", () => {
  it("hashea, bumpea sessionVersion y registra actividad", async () => {
    const fd = new FormData();
    fd.set("newPassword", "secreto123");
    fd.set("confirmPassword", "secreto123");

    await expect(cambiarMiContrasena({}, fd)).rejects.toThrow(
      "REDIRECT /login"
    );

    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: USER.id },
      data: {
        passwordHash: expect.stringMatching(/^\$2[aby]\$/),
        sessionVersion: { increment: 1 },
      },
    });

    const call = mockPrisma.usuario.update.mock.calls[0][0];
    expect(call.data.passwordHash).not.toContain("secreto123");
    expect(call.data.passwordHash.length).toBeGreaterThan(20);

    expect(mockRegistrarActividad).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "USUARIO_PASSWORD_CAMBIADO",
        entidad: "USUARIO",
        entidadId: USER.id,
        userId: USER.id,
      })
    );

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("rechaza contraseñas que no coinciden", async () => {
    const fd = new FormData();
    fd.set("newPassword", "secreto123");
    fd.set("confirmPassword", "secreto456");

    const res = await cambiarMiContrasena({}, fd);
    expect(res.fieldErrors?.confirmPassword).toBe(
      "Las contraseñas no coinciden"
    );
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas demasiado cortas", async () => {
    const fd = new FormData();
    fd.set("newPassword", "123");
    fd.set("confirmPassword", "123");

    const res = await cambiarMiContrasena({}, fd);
    expect(res.error).toBeDefined();
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
  });

  it("no llama a signOut si la validación falla", async () => {
    const fd = new FormData();
    fd.set("newPassword", "secreto123");
    fd.set("confirmPassword", "distinto");

    await cambiarMiContrasena({}, fd);

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});