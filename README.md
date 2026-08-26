# IFPC Platform

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

```bash
pnpm install
docker compose up -d          # postgres + redis + minio
cp .env.example .env          # adjust values if needed
pnpm db:migrate               # create the database schema
pnpm db:seed                  # demo data
pnpm dev                      # http://localhost:3000
```

## Structure

- Compact specification for AI agents: `IA_information/IA_agent_info.txt`
- Detailed directory tree: `IA_information/Estructure.txt`

