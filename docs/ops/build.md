# Producción · Build y despliegue

## Requisitos

- Node 20+ y pnpm 9+
- Base de datos PostgreSQL (o PGlite embebido para dev)
- Variables de entorno: ver `.env.example`

## Variables de entorno (producción)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | PostgreSQL (en prod usar `USE_PGLITE=false`) |
| `USE_PGLITE` | `true` para PGlite embebido, `false` con PostgreSQL real |
| `AUTH_SECRET` | Secreto de Auth.js (generar con `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `RESEND_API_KEY` | API key de Resend (email de recuperación) |
| `RESEND_FROM_EMAIL` | Remitente de los emails (opcional) |
| `REDIS_URL` | Redis para el worker (BullMQ) |
| `S3_*` | Bucket S3/MinIO para vídeos/upload |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Pagos |

## Pasos de build

```bash
# 1. Instalar dependencias
pnpm install

# 2. Preparar la base de datos (una sola vez)
pnpm db:setup-pglite   # dev con PGlite
# o en producción con PostgreSQL:
#   pnpm --filter database exec prisma migrate deploy

# 3. Validar el monorepo
pnpm lint && pnpm typecheck && pnpm test

# 4. Build de producción (web + worker)
pnpm build
```

> ⚠️ No ejecutar `pnpm build` mientras `pnpm dev` esté activo: comparten `.next` y el
> cliente Prisma puede fallar por locks de archivo en Windows.

## Worker (jobs en segundo plano)

```bash
pnpm --filter worker dev       # dev (con Redis disponible)
# producción:
pnpm --filter worker start     # usa apps/worker/dist
```

Jobs: `video`, `matching`, `notification`, `report`, `maintenance` (cron diario).

## Despliegue sugerido

- **Web**: Vercel/Next.js — comando `pnpm --filter web build`, salida `apps/web/.next`.
- **Worker**: contenedor Node con Redis (Docker o servicio gestionado).
- **Base de datos**: PostgreSQL gestionado; correr migraciones antes de desplegar.
- **Storage**: S3/MinIO para uploads (los uploads locales en `public/uploads` son solo dev).

## Notas

- En dev, los emails se loguean en consola si `RESEND_API_KEY` no está configurada.
- Stripe webhooks (`/api/webhooks`) responden 501 hasta integrar el checkout.
