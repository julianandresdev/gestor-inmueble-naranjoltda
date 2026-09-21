import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/dal", () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { InmutableAuditError, runWithRetentionPurge } from "@/lib/prisma";
import { extractClientInfo, extractClientIp } from "@/lib/client-info";
import { calcularCambiosAuditables } from "@/lib/audit";

describe("Auditoría - Inmutabilidad y Reglas de Privacidad", () => {
  describe("Reglas de Privacidad en Diffs", () => {
    it("enmascara contraseñas, tokens y notas sin mostrar valores", () => {
      const antes = { passwordHash: "hash1", contenido: "texto privado", estado: "ACTIVO" };
      const despues = { passwordHash: "hash2", contenido: "texto nuevo", estado: "ACTIVO" };
      const diff = calcularCambiosAuditables(antes, despues);

      expect(diff).toEqual({
        passwordHash: { anterior: "[MODIFICADO]", nuevo: "[MODIFICADO]" },
        contenido: { anterior: "[MODIFICADO]", nuevo: "[MODIFICADO]" },
      });
    });

    it("no copia datos personales de clientes (propietarios y arrendatarios)", () => {
      const antes = {
        docArrendatario: "12345678",
        arrendatario: "Juan Pérez",
        celArre1: "3001234567",
        emailArre: "juan@example.com",
        barrio: "Centro",
      };
      const despues = {
        docArrendatario: "87654321",
        arrendatario: "María Gómez",
        celArre1: "3109876543",
        emailArre: "maria@example.com",
        barrio: "Norte",
      };
      const diff = calcularCambiosAuditables(antes, despues);

      expect(diff).toEqual({
        docArrendatario: { anterior: "[DATO_PERSONAL_RESERVADO]", nuevo: "[DATO_PERSONAL_RESERVADO]" },
        arrendatario: { anterior: "[DATO_PERSONAL_RESERVADO]", nuevo: "[DATO_PERSONAL_RESERVADO]" },
        celArre1: { anterior: "[DATO_PERSONAL_RESERVADO]", nuevo: "[DATO_PERSONAL_RESERVADO]" },
        emailArre: { anterior: "[DATO_PERSONAL_RESERVADO]", nuevo: "[DATO_PERSONAL_RESERVADO]" },
        barrio: { anterior: "Centro", nuevo: "Norte" },
      });
    });

    it("ignora campos internos del sistema como timestamps y sessionVersion", () => {
      const antes = { updatedAt: new Date(), sessionVersion: 1, ciudad: "Cali" };
      const despues = { updatedAt: new Date(), sessionVersion: 2, ciudad: "Cali" };
      const diff = calcularCambiosAuditables(antes, despues);

      expect(diff).toBeNull();
    });
  });

  describe("Extracción de IP y Dispositivo", () => {
    it("extrae la IP real tomando el primer valor de x-forwarded-for", () => {
      const headers = new Headers({
        "x-forwarded-for": "186.84.90.12, 10.0.0.1, 192.168.1.1",
      });
      const ip = extractClientIp(headers);
      expect(ip).toBe("186.84.90.12");
    });

    it("toma x-real-ip si x-forwarded-for no existe", () => {
      const headers = new Headers({
        "x-real-ip": "190.25.10.5",
      });
      const ip = extractClientIp(headers);
      expect(ip).toBe("190.25.10.5");
    });

    it("parsea geolocalización de Vercel y user-agent correctamente", () => {
      const headers = new Headers({
        "x-forwarded-for": "186.84.90.12",
        "x-vercel-ip-country": "CO",
        "x-vercel-ip-city": "Bogota",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      });
      const info = extractClientInfo(headers);

      expect(info.ip).toBe("186.84.90.12");
      expect(info.pais).toBe("CO");
      expect(info.ciudad).toBe("Bogota");
      expect(info.dispositivo).toBe("desktop");
      expect(info.navegador).toContain("Chrome");
      expect(info.sistemaOperativo).toMatch(/macOS|Mac OS/);
    });
  });

  describe("Inmutabilidad y Excepción de Retención", () => {
    it("instancia correctamente InmutableAuditError", () => {
      const err = new InmutableAuditError("Actividad", "delete");
      expect(err.name).toBe("InmutableAuditError");
      expect(err.message).toContain("es estrictamente inmutable");
    });

    it("permite ejecutar funciones dentro de runWithRetentionPurge", async () => {
      const resultado = await runWithRetentionPurge(async () => {
        return "purga_autorizada";
      });
      expect(resultado).toBe("purga_autorizada");
    });
  });
});
