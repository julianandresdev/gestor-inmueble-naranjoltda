# Operación, CI/CD y releases

## Fuente de verdad

- `main` contiene el código listo para producción.
- Las ramas de trabajo usan `feature/`, `fix/`, `chore/` o `codex/`.
- Cada cambio entra mediante pull request y debe pasar el workflow `CI`.
- Los releases se etiquetan con SemVer, por ejemplo `v0.1.0`.

Un release debe indicar cambios funcionales, migraciones Prisma, variables
nuevas, riesgos y rollback. No se deben subir secretos, dumps ni archivos
`.env` al repositorio.

## Ciclo local recomendado

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d postgres
pnpm env:check
pnpm db:migrate:deploy
pnpm seed:admin
pnpm dev
```

Para una base vacía de desarrollo se puede usar `pnpm prisma:migrate` en lugar
de `pnpm db:migrate:deploy` para crear una migración nueva durante el trabajo.
No se debe usar `prisma db push` como sustituto de migraciones compartidas.

## Checks antes de fusionar

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

El comando `pnpm build` solo compila. `pnpm db:migrate:deploy` es una operación
separada y explícita contra una base seleccionada.

## Migraciones y rollback

1. Crear la migración localmente con `pnpm prisma:migrate --name descripcion`.
2. Revisar el SQL generado y probarlo sobre una base restaurada o de staging.
3. Comprobar `pnpm db:migrate:status` antes de desplegar.
4. Respaldar la base antes de una migración con riesgo.
5. Aplicar `pnpm db:migrate:deploy` una sola vez contra el entorno objetivo.

Las migraciones aplicadas no se editan ni se borran. Una corrección posterior se
modela como otra migración. El rollback de aplicación debe poder ejecutarse con
la base ya migrada; para cambios incompatibles se requiere una migración de
transición (expandir, desplegar, contraer).

## Docker

El Compose del repositorio levanta PostgreSQL para desarrollo. El `Dockerfile`
genera una imagen Next.js standalone para un runtime Node 22 mínimo. La imagen
no ejecuta migraciones al iniciar: ejecútalas como paso controlado con la misma
`DATABASE_URL` antes de cambiar tráfico.

```bash
docker compose up -d postgres
docker build -t gestor-inmueble:local .
docker run --rm -p 3000:3000 --env-file .env gestor-inmueble:local
```

Vercel no necesita esta imagen; el Dockerfile sirve como artefacto reproducible
alternativo y como prueba de que la aplicación puede ejecutarse como servidor
Node.

## Backup y restauración de Neon

Usa la cadena directa de Neon en una variable temporal, nunca en un archivo
versionado:

```bash
mkdir -p backups
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL_PROD_DIRECT" \
  --file="backups/gestor-inmueble-neon-$(date +%F).dump"
```

Restaura en una base local limpia con `pg_restore`, verifica conteos y login,
y conserva el dump fuera de Git. La carpeta `backups/` está excluida por
`.gitignore` y `.dockerignore`.
