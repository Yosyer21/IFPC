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

Tras crear la base de datos, aplicar el esquema desde la pestaña **Run** de Railway:

```bash
pnpm --filter database exec prisma db push
```

(o con migraciones: `prisma migrate deploy`). También puedes sembrar datos demo con
`pnpm db:setup-pglite` localmente, pero en producción usa el PostgreSQL real.

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
