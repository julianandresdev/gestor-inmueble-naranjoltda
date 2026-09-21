import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadDotEnv();

const required = ["DATABASE_URL", "AUTH_SECRET"];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(`Faltan variables requeridas: ${missing.join(", ")}`);
  console.error("Copia .env.example a .env y completa sus valores.");
  process.exit(1);
}

const authSecret = process.env.AUTH_SECRET;
if (authSecret.includes("reemplaza-por")) {
  console.error("AUTH_SECRET no debe usar el valor de plantilla.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && authSecret.length < 32) {
  console.error("AUTH_SECRET debe ser un secreto real de al menos 32 caracteres en producción.");
  process.exit(1);
}

if (authSecret.length < 32) {
  console.warn("Aviso: se recomienda que AUTH_SECRET tenga al menos 32 caracteres (ej: openssl rand -base64 32).");
}

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL) {
  console.error("NEXT_PUBLIC_APP_URL es obligatoria en producción.");
  process.exit(1);
}

console.log("Variables de entorno requeridas: OK");
