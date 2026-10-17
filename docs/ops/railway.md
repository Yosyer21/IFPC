# Railway · Deployment

Railway deploys the repository from GitHub. The repo is a pnpm monorepo with
**2 services** (web and worker) + PostgreSQL database.

## Services

| Service | Root Directory | Dockerfile Path | Exposes |
| --- | --- | --- | --- |
| **Web** (Next.js) | `.` (root) | `infrastructure/docker/Dockerfile.web` | Port 3000 |
| **Worker** (BullMQ) | `.` (root) | `infrastructure/docker/Dockerfile.worker` | — (processes queues) |

- The first service created when connecting the repo uses the root `railway.json`
  (web, Dockerfile.web + `/` healthcheck).
- The **worker** is added as a second service: in the dashboard → *New Service* →
  same repository → adjust *Dockerfile Path* to `infrastructure/docker/Dockerfile.worker`.

## Data plugins

1. **PostgreSQL**: create *PostgreSQL* plugin → exposes `DATABASE_URL`.
2. **Redis** (optional but recommended for the worker/BullMQ): create *Redis* plugin →
   exposes `REDIS_URL`. Without Redis the worker starts but cannot enqueue jobs.

## Environment variables

| Variable | Value |
| --- | --- |
| `USE_PGLITE` | `false` (in production real PostgreSQL is used) |
| `DATABASE_URL` | from the PostgreSQL plugin |
| `REDIS_URL` | from the Redis plugin (optional) |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Auth.js base URL: the app's public URL (must match the domain used in the Google redirect URI) |
| `NEXT_PUBLIC_APP_URL` | public URL of the app (the `.up.railway.app` domain or a custom one) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional, sign-in/sign-up with Google (see `docs/technical/authentication.md`) |
| `RESEND_API_KEY` | recovery/verification email |
| `RESEND_FROM_EMAIL` | sender (optional) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | payments (optional) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_ENDPOINT` | uploads (optional) |

> The same variables for web and worker. `DATABASE_URL` and `REDIS_URL` come from the plugins.

## Inicio de sesión con Google

1. En el cliente OAuth (**Web application**) de la consola de Google añade:
   - _Authorized JavaScript origins_: `https://futureballler.up.railway.app` (+ `http://localhost:3000`)
   - _Authorized redirect URIs_: `https://futureballler.up.railway.app/api/auth/callback/google`
     (+ `http://localhost:3000/api/auth/callback/google`)
2. Guarda las credenciales en el servicio web (el secreto por `--stdin`, para no dejarlo en
   el historial):

   ```bash
   railway variable set -s IFPC AUTH_GOOGLE_ID=xxxx.apps.googleusercontent.com
   printf '%s' 'GOCSPX-xxxx' | railway variable set -s IFPC AUTH_GOOGLE_SECRET --stdin
   ```

   Al cambiar variables, Railway redespliega solo. Auth.js construye el `redirect_uri` a
   partir de `AUTH_URL`, así que **debe** coincidir con el que registres en Google.
3. Comprueba que el provider está activo:

   ```bash
   curl -s https://futureballler.up.railway.app/api/auth/providers   # debe aparecer "google"
   ```

## Migrations

`start-web.sh` ejecuta `prisma db push --skip-generate` en **cada arranque**, así que un
deploy mantiene la base de datos alineada con `packages/database/prisma/schema.prisma`
automáticamente (se ve en los logs: *«Your database is now in sync with your Prisma
schema»*). Lo de abajo solo hace falta para aplicar un cambio de esquema **sin desplegar**,
o para sembrar a mano. Desde local, a través del túnel de Railway (el host
`postgres.railway.internal` es privado):

```bash
railway connect Postgres --tunnel-only --port 55432
# in another terminal, with DATABASE_URL pointing to 127.0.0.1:55432:
pnpm --filter database exec prisma db push
```

Or from the **Run** tab of Railway with the production PostgreSQL:

```bash
pnpm --filter database exec prisma db push
```

Demo seed (example users/roles, it cleans what it creates and seeds fresh data):

```bash
pnpm --filter database db:seed
```

Generated credentials: `admin@ifpc.com/admin123`, `player@demo.com/player123`,
`parent@demo.com/parent123`, `club@demo.com/club123`, `agent@demo.com/agent123`,
`scout@demo.com/scout123`, `coach@demo.com/coach123`, `university@demo.com/university123`.

## Node.js requirement (build)

The monorepo pins `pnpm@11.20.0` (packageManager + corepack). **pnpm ≥ 11 requires
Node ≥ 22.13** (`node:sqlite`). The Dockerfiles use `node:22-alpine` and the root
`package.json` declares `engines.node: ">=22.13.0"`. GitHub Actions workflows also use
Node 22. Do not downgrade to Node 20 or the `pnpm install` inside the container will fail
with `ERR_UNKNOWN_BUILTIN_MODULE: No such built-in module: node:sqlite`.

## Web build details (standalone + Prisma)

- The `builder` stage also copies `package.json`, `pnpm-workspace.yaml`,
  `pnpm-lock.yaml` and `tsconfig.json` (the `apps/web` tsconfig extends
  `../../tsconfig.json`).
- `apps/web/next.config.mjs` includes `@ifpc/database` in `transpilePackages`
  (it publishes TS sources).
- The standalone output does not trace the Prisma query engine
  (`libquery_engine-linux-musl-openssl-3.0.x.so.node`). The Dockerfile copies it to
  `/app/prisma-engines` and points to it via `PRISMA_QUERY_ENGINE_LIBRARY`.

## Applied state (2026-08)

- **Web**: `IFPC` service, online, domain `https://futureballler.up.railway.app` (los
  antiguos `ifpc.up.railway.app` e `ifpc-production-0c78.up.railway.app` ya no resuelven).
- **PostgreSQL**: `Postgres` plugin (postgres-ssl:18), `postgres-volume` volume,
  `DATABASE_URL` injected into the web service.
- **Web variables**: `USE_PGLITE=false`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` y
  `NEXT_PUBLIC_APP_URL` (los dos últimos con el dominio público), `SEED_DEMO_DATA=true`.
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` se añaden cuando existan las credenciales.
  `RESEND_API_KEY`, `STRIPE_*` y `S3_*` siguen pendientes (opcionales).
- **Worker**: pending deployment — requires creating the service from the dashboard
  with *Dockerfile Path* `infrastructure/docker/Dockerfile.worker` and a Redis plugin
  (`REDIS_URL`). The web currently inserts notifications synchronously
  (`notifyUser`), so it does not depend on Redis.

## Applied state (verificado 2026-10)

`railway status --json` con la sesión actual (`railway whoami`):

- Proyecto **`IFPC`**, entorno **`production`**, con **tres servicios `RUNNING`**:
  `IFPC` (web, puerto 8080 interno), `Postgres` y `rtc` (salas de vídeo, puerto 4001).
- El despliegue activo del web se corresponde con el último commit de `main`
  (`meta.commitHash` y `meta.commitAuthor` en `railway status --json`), con
  `reason: deploy` y `repo: Yosyer21/IFPC`: **el push a `main` despliega solo**.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` **ya están puestas**: `/api/auth/providers`
  devuelve `credentials` **y** `google`.
- En el arranque del web, `prisma db push` informa de que la base **ya está en sync** y el
  seed de demo vuelve a dejar disponibles los usuarios (`player@demo.com / player123`, …),
  así que el smoke autenticado funciona contra producción.


## Verificación del despliegue (CLI)

La sesión de la CLI se comprueba con `railway whoami` (no pide nada si ya hay sesión).
**Ojo**: este repo está enlazado al servicio **`rtc`**, así que los comandos sin `-s`
muestran los logs del servicio de salas; para el web hay que indicarlo.

```bash
railway whoami
railway status --json                                  # proyecto, servicios y despliegues
railway status --json | jq -r \
  '.environments.edges[].node.serviceInstances.edges[].node
   | {service: (.serviceName // .name), status: (.activeDeployments[0].instances[0].status // "-")}'
railway logs --lines 60 -s IFPC -d                     # logs del deploy del web
railway logs --lines 25 -s rtc  -d                     # logs del servicio de salas
```

Un despliegue sano del web muestra, en este orden:
`[start] aplicando esquema Prisma…` → *«The database is already in sync with the Prisma schema»*
→ `[start] cargando datos de demo (SEED_DEMO_DATA=true)…` → `[start] arrancando servidor web…`
→ `✓ Ready`. El servicio `rtc` muestra `[rtc] salas escuchando en :4001`.

Smoke público (sin sesión):

```bash
for p in / /login /api/auth/providers /robots.txt /sitemap.xml; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://futureballler.up.railway.app$p")" "$p"
done
# /api/auth/providers debe incluir "credentials" y "google"
```

Smoke autenticado (solo lectura) con Playwright contra producción: entrar con un usuario
demo (`player@demo.com / player123`) y comprobar `/dashboard/health` (título, 7 tarjetas,
buscador) y `/dashboard/calendar` (rejilla y día seleccionable). **No** pulsar hábitos ni
guardar nada para no escribir en la base de datos de producción.

## Aviso: `railway.json` (Config as Code) queda obsoleto

Railway avisa en los logs de cada despliegue:

> Config as Code (railway.json / railway.toml) is deprecated. Prefer Infrastructure as
> Code (.railway/railway.ts) … Existing files keep working until **2026-12-01**.

**No se ha migrado a propósito.** `railway config migrate` genera `.railway/railway.ts` y,
a partir de ahí, **Railway pasa a considerar la IaC como dueña de la configuración del
proyecto**: si el fichero generado no declara los tres servicios (`IFPC`, `Postgres`,
`rtc`), un despliegue posterior podría alterarlos o eliminarlos. La migración hay que
hacerla revisando el fichero generado y, a ser posible, probándola antes fuera de
producción. Fecha límite: **1 de diciembre de 2026**.

## Building the Dockerfiles locally (validation)

```bash
docker build -f infrastructure/docker/Dockerfile.web -t ifpc-web .
docker build -f infrastructure/docker/Dockerfile.worker -t ifpc-worker .
```

## Notes

- **Standalone**: `apps/web/next.config.mjs` enables `output: 'standalone'` with the env
  `STANDALONE=true` (defined in Dockerfile.web). On local/Windows the normal build does not
  generate standalone because Windows blocks symlink creation without Developer Mode.
- **Worker in production**: runs with `node --import=tsx src/index.ts` because the workspace
  packages publish TS sources (`@ifpc/database` etc.).
- **PGlite** is only used in development (`USE_PGLITE=true`); on Railway it is `false`.

