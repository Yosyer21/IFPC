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
| `NEXT_PUBLIC_APP_URL` | public URL of the app (the `.up.railway.app` domain or a custom one) |
| `RESEND_API_KEY` | recovery/verification email |
| `RESEND_FROM_EMAIL` | sender (optional) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | payments (optional) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_ENDPOINT` | uploads (optional) |

> The same variables for web and worker. `DATABASE_URL` and `REDIS_URL` come from the plugins.

## Migrations (one-time)

After creating the database, apply the schema. From local, connecting through the Railway
tunnel (the `postgres.railway.internal` host is private):

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

- **Web**: `IFPC` service, online, domain `https://ifpc-production-0c78.up.railway.app`.
- **PostgreSQL**: `Postgres` plugin (postgres-ssl:18), `postgres-volume` volume,
  `DATABASE_URL` injected into the web service.
- **Web variables**: `USE_PGLITE=false`, `DATABASE_URL`, `AUTH_SECRET`,
  `NEXT_PUBLIC_APP_URL` (public domain). `RESEND_API_KEY`, `STRIPE_*` and `S3_*` are
  still pending (optional, depending on enabled features).
- **Worker**: pending deployment — requires creating the service from the dashboard
  with *Dockerfile Path* `infrastructure/docker/Dockerfile.worker` and a Redis plugin
  (`REDIS_URL`). The web currently inserts notifications synchronously
  (`notifyUser`), so it does not depend on Redis.

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

