# Future Baller Platform

Global football platform for player development and professional recruitment:
player profiles, videos, training, scouting, trials, negotiations, contracts,
player↔club matching, memberships and payments.

## Stack

- Monorepo: pnpm + Turborepo
- `apps/web` — Next.js 15 (App Router, TypeScript, Tailwind CSS)
- `apps/worker` — Node.js + BullMQ/Redis (video, matching, notifications, reports jobs)
- `packages/database` — Prisma + PostgreSQL
- `packages/auth` — Auth.js v5 (RBAC)
- `packages/{types,config,validation,ui}` — shared code

## Requirements

- Node ≥ 22.13
- pnpm ≥ 9
- Docker (optional, for local postgres/redis/minio)

## Getting started

Requires Node ≥ 22.13 and pnpm ≥ 9. Docker is optional.

### Option A — no Docker (embedded PGlite database, recommended for a quick start)

```bash
pnpm install
cp .env.example .env          # set AUTH_SECRET and an ABSOLUTE PGLITE_DIR
pnpm db:setup-pglite          # Prisma client + schema + demo data (one command)
pnpm dev                      # http://localhost:3000
```

> `PGLITE_DIR` must be an **absolute** path (e.g. `/home/you/Future Baller/.pglite`) and the
> same value in the root `.env` and in `apps/web/.env.local`. To reset the DB,
> delete `.pglite/` and run `pnpm db:setup-pglite` again.
>
> Demo users (seeded): `player@demo.com / player123`, `parent@demo.com / parent123`,
> `coach@demo.com / coach123`, `scout@demo.com / scout123`, `agent@demo.com / agent123`,
> `club@demo.com / club123`, `university@demo.com / university123`,
> `school@demo.com / school123`, `admin@ifpc.com / admin123`.
>
> **All profiles for manual testing:** run `pnpm scripts:create-test-users` to (re)create
> one test account per role (with its linked record) and generate **`TEST_PROFILES.txt`**
> at the repo root with every email/password and its dashboard area.

### Option B — with Docker (real Postgres + Redis + MinIO)

```bash
pnpm install
docker compose up -d          # postgres + redis + minio
cp .env.example .env          # set USE_PGLITE=false and adjust values
pnpm db:migrate               # create the database schema
pnpm db:seed                  # demo data
pnpm dev                      # http://localhost:3000
```

## Optional services (local, no Docker)

- **Worker** (`apps/worker`, BullMQ) needs **Redis** to process background jobs. The
  **web app does not need Redis**: in dev the notifications are written straight to
  the database. To run the worker locally:

  ```bash
  sudo dnf install -y redis        # Fedora/RHEL
  sudo systemctl enable --now redis
  pnpm --filter @ifpc/worker dev
  ```

- **Uploads** use the local `UPLOAD_DIR` (no S3/MinIO needed in dev).
- **Stripe** and **Resend** are optional in dev: checkout falls back to a simulated
  payment and emails are logged to the console.

## Structure

- Compact specification for AI agents: `IA_information/IA_agent_info.txt`
- Detailed directory tree: `IA_information/Estructure.txt`

