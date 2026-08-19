import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Destinacion } from "../src/generated/prisma/client";

type DestinacionValue = Destinacion | null;

type Row = {
  noInm: string | null;
  barrio: string | null;
  ciudad: string | null;
  tipoInmueble: string | null;
  destinacion: DestinacionValue;
  direccion: string | null;
  docArrendatario: string | null;
  arrendatario: string | null;
  celArre1: string | null;
  emailArre: string | null;
  docPropietario: string | null;
  propietario: string | null;
  emailPro: string | null;
  celPro1: string | null;
  vigenciaContrato: string | null;
  nomAdmin: string | null;
  observaciones: string | null;
};

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim();
  if (!s || s === "null") return null;
  return s;
}

function toDestinacion(v: unknown): DestinacionValue {
  const s = toStr(v);
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.startsWith("viv")) return "VIVIENDA";
  if (lower.startsWith("com")) return "COMERCIO";
  return null;
}

function normalizeNoInm(v: unknown): string | null {
  const s = toStr(v);
  if (!s) return null;
  // Excel lo trae como número. Lo dejamos como string.
  return s;
}

async function main() {
  const wb = XLSX.readFile("docs/listado_llamadas.xlsx");
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
  });

  const rows: Row[] = rawRows.map((r) => ({
    noInm: normalizeNoInm(r["No. Inm"]),
    barrio: toStr(r["Barrio"]),
    ciudad: toStr(r["Ciudad"]),
    tipoInmueble: toStr(r["Tipo Inmueble"]),
    destinacion: toDestinacion(r["Destinacion"]),
    direccion: toStr(r["Dirección"]),
    docArrendatario: toStr(r["Doc. Arrendatario"]),
    arrendatario: toStr(r["Arrendatario"]),
    celArre1: toStr(r["CelArre1"]),
    emailArre: toStr(r["EmailArre"]),
    docPropietario: toStr(r["Doc. Propietario"]),
    propietario: toStr(r["Propietario"]),
    emailPro: toStr(r["EmailPro"]),
    celPro1: toStr(r["CelPro1"]),
    vigenciaContrato: toStr(r["Vigencia Contrato"]),
    nomAdmin: toStr(r["NomAdmin"]),
    observaciones: toStr(r["Observaciones"]),
  }));

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const admin = await prisma.usuario.findFirst({
    where: { username: "admin" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("admin no encontrado. Ejecuta primero pnpm seed:admin");
  }

  let created = 0;
  let skippedDup = 0;
  let skippedNoInm = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.noInm) {
      skippedNoInm++;
      continue;
    }

    const existing = await prisma.inmueble.findUnique({
      where: { noInm: row.noInm },
      select: { id: true },
    });
    if (existing) {
      skippedDup++;
      continue;
    }

    try {
      await prisma.inmueble.create({
        data: {
          noInm: row.noInm,
          barrio: row.barrio,
          ciudad: row.ciudad,
          tipoInmueble: row.tipoInmueble,
          destinacion: row.destinacion,
          direccion: row.direccion,
          docArrendatario: row.docArrendatario,
          arrendatario: row.arrendatario,
          celArre1: row.celArre1,
          emailArre: row.emailArre,
          docPropietario: row.docPropietario,
          propietario: row.propietario,
          emailPro: row.emailPro,
          celPro1: row.celPro1,
          vigenciaContrato: row.vigenciaContrato,
          nomAdmin: row.nomAdmin,
          observaciones: row.observaciones,
          createdById: admin.id,
          updatedById: admin.id,
        },
      });
      created++;
    } catch (e) {
      errors++;
      console.error("Error en", row.noInm, e);
    }
  }

  console.log("---");
  console.log("Filas totales:", rows.length);
  console.log("Creados:", created);
  console.log("Saltados (noInm vacío):", skippedNoInm);
  console.log("Saltados (duplicados):", skippedDup);
  console.log("Errores:", errors);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
