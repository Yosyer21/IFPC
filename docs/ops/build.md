# Production · Build and deployment

## Requirements

- Node 22.13+ and pnpm 9+
- PostgreSQL database (or embedded PGlite for dev)
- Environment variables: see `.env.example`

## Environment variables (production)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL (in prod use `USE_PGLITE=false`) |
| `USE_PGLITE` | `true` for embedded PGlite, `false` with real PostgreSQL |
| `AUTH_SECRET` | Auth.js secret (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |
| `RESEND_API_KEY` | Resend API key (recovery email) |
| `RESEND_FROM_EMAIL` | Email sender (optional) |
| `REDIS_URL` | Redis for the worker (BullMQ) |
| `S3_*` | S3/MinIO bucket for videos/uploads |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |

## Build steps

```bash
# 1. Install dependencies
pnpm install

# 2. Prepare the database (one-time)
pnpm db:setup-pglite   # dev with PGlite
# or in production with PostgreSQL:
#   pnpm --filter database exec prisma migrate deploy

# 3. Validate the monorepo
pnpm lint && pnpm typecheck && pnpm test

# 4. Production build (web + worker)
pnpm build
```

> ⚠️ Do not run `pnpm build` while `pnpm dev` is active: they share `.next` and the
> Prisma client can fail due to file locks on Windows.
>
> ⚠️ Public pages are `force-dynamic` (layout `(public)`): they query the database on
> each request and must not be prerendered at build time (PGlite/WASM aborts). If the build
> corrupts `.pglite`, reset: `Remove-Item .pglite` + `pnpm db:setup-pglite`.

## Worker (background jobs)

```bash
pnpm --filter worker dev       # dev (with Redis available)
# production:
pnpm --filter worker start     # uses apps/worker/dist
```

Jobs: `video`, `matching`, `notification`, `report`, `maintenance` (daily cron).

## Suggested deployment

- **Web**: Vercel/Next.js — command `pnpm --filter web build`, output `apps/web/.next`.
- **Worker**: Node container with Redis (Docker or managed service).
- **Database**: managed PostgreSQL; run migrations before deploying.
- **Storage**: S3/MinIO for uploads (local uploads in `public/uploads` are dev-only).

## Notes

- In dev, emails are logged to the console if `RESEND_API_KEY` is not configured.
- Stripe webhooks (`/api/webhooks`) respond 501 until the checkout is integrated.

