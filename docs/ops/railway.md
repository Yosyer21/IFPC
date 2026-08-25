# Railway · Despliegue

Railway despliega el repositorio desde GitHub. El repo es un monorepo pnpm con
**2 servicios** (web y worker) + base de datos PostgreSQL.

## Servicios

| Servicio | Root Directory | Dockerfile Path | Expone |
| --- | --- | --- | --- |
| **Web** (Next.js) | `.` (raíz) | `infrastructure/docker/Dockerfile.web` | Puerto 3000 |
| **Worker** (BullMQ) | `.` (raíz) | `infrastructure/docker/Dockerfile.worker` | — (procesa colas) |

- El primer servicio que se crea al conectar el repo usa el `railway.json` de la raíz
  (web, Dockerfile.web + healthcheck `/`).
- El **worker** se añade como segundo servicio: en el dashboard → *New Service* →
  mismo repositorio → ajustar *Dockerfile Path* a `infrastructure/docker/Dockerfile.worker`.

## Plugins de datos

1. **PostgreSQL**: crear plugin *PostgreSQL* → expone `DATABASE_URL`.
2. **Redis** (opcional pero recomendado para el worker/BullMQ): crear plugin *Redis* →
   expone `REDIS_URL`. Sin Redis, el worker arranca pero no puede encolar jobs.

## Variables de entorno

| Variable | Valor |
| --- | --- |
| `USE_PGLITE` | `false` (en producción se usa PostgreSQL real) |
| `DATABASE_URL` | del plugin PostgreSQL |
| `REDIS_URL` | del plugin Redis (opcional) |
| `AUTH_SECRET` | secreto Auth.js (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (el dominio `.up.railway.app` o el custom) |
| `RESEND_API_KEY` | email de recuperación/verificación |
| `RESEND_FROM_EMAIL` | remitente (opcional) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | pagos (opcional) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_ENDPOINT` | uploads (opcional) |

> Las mismas variables para web y worker. `DATABASE_URL` y `REDIS_URL` salen de los plugins.

## Migraciones (una vez)

Tras crear la base de datos, aplicar el esquema. Desde local, conectando con el túnel
de Railway (el host `postgres.railway.internal` es privado):

```bash
railway connect Postgres --tunnel-only --port 55432
# en otra terminal, con DATABASE_URL apuntando a 127.0.0.1:55432:
pnpm --filter database exec prisma db push
```

O desde la pestaña **Run** de Railway con el PostgreSQL de producción:

```bash
pnpm --filter database exec prisma db push
```

Seed demo (usuarios/roles de ejemplo, borra lo que crea y crea datos limpios):

```bash
pnpm --filter database db:seed
```

Credenciales generadas: `admin@ifpc.com/admin123`, `player@demo.com/player123`,
`parent@demo.com/parent123`, `club@demo.com/club123`, `agent@demo.com/agent123`,
`scout@demo.com/scout123`, `coach@demo.com/coach123`, `university@demo.com/university123`.

## Requisito de Node.js (build)

El monorepo fija `pnpm@11.20.0` (packageManager + corepack). **pnpm ≥ 11 requiere
Node ≥ 22.13** (`node:sqlite`). Los Dockerfiles usan `node:22-alpine` y el root
`package.json` declara `engines.node: ">=22.13.0"`. Los workflows de GitHub Actions
también usan Node 22. No bajar a Node 20 o el `pnpm install` en el contenedor
fallará con `ERR_UNKNOWN_BUILTIN_MODULE: No such built-in module: node:sqlite`.

## Detalles del build web (standalone + Prisma)

- El stage `builder` copia además `package.json`, `pnpm-workspace.yaml`,
  `pnpm-lock.yaml` y `tsconfig.json` (el tsconfig de `apps/web` extiende
  `../../tsconfig.json`).
- `apps/web/next.config.mjs` incluye `@ifpc/database` en `transpilePackages`
  (publica fuentes TS).
- El output standalone no traza el query engine de Prisma
  (`libquery_engine-linux-musl-openssl-3.0.x.so.node`). El Dockerfile lo copia a
  `/app/prisma-engines` y apunta `PRISMA_QUERY_ENGINE_LIBRARY`.

## Estado aplicado (2026-08)

- **Web**: servicio `IFPC`, online, dominio `https://ifpc-production-0c78.up.railway.app`.
- **PostgreSQL**: plugin `Postgres` (postgres-ssl:18), volumen `postgres-volume`,
  `DATABASE_URL` inyectado al servicio web.
- **Variables en web**: `USE_PGLITE=false`, `DATABASE_URL`, `AUTH_SECRET`,
  `NEXT_PUBLIC_APP_URL` (dominio público). `RESEND_API_KEY`, `STRIPE_*` y `S3_*`
  quedan pendientes (opcionales, según funcionalidades activadas).
- **Worker**: pendiente de desplegar — requiere crear el servicio desde el dashboard
  con *Dockerfile Path* `infrastructure/docker/Dockerfile.worker` y un plugin Redis
  (`REDIS_URL`). El web actualmente inserta notificaciones de forma síncrona
  (`notifyUser`), así que no depende de Redis.

## Build local de los Dockerfiles (validación)

```bash
docker build -f infrastructure/docker/Dockerfile.web -t ifpc-web .
docker build -f infrastructure/docker/Dockerfile.worker -t ifpc-worker .
```

## Notas

- **Standalone**: `apps/web/next.config.mjs` activa `output: 'standalone'` con la env
  `STANDALONE=true` (el Dockerfile.web la define). En local/Windows el build normal no
  genera standalone porque Windows bloquea la creación de symlinks sin Developer Mode.
- **Worker en producción**: se ejecuta con `node --import=tsx src/index.ts` porque los
  paquetes del workspace publican fuentes TS (`@ifpc/database` etc.).
- **PGlite** solo se usa en desarrollo (`USE_PGLITE=true`); en Railway va `false`.
