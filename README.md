# Future Buller Platform

Plataforma global de fútbol para el desarrollo de jugadores y el reclutamiento profesional:
perfiles de jugadores, vídeos, entrenamiento, scouting, trials, negociaciones, contratos,
matching jugador↔club, membresías y pagos.

## Stack

- Monorepo: pnpm + Turborepo
- `apps/web` — Next.js 15 (App Router, TypeScript, Tailwind CSS)
- `apps/worker` — Node.js + BullMQ/Redis (jobs de video, matching, notificaciones, reportes)
- `packages/database` — Prisma + PostgreSQL
- `packages/auth` — Auth.js v5 (RBAC)
- `packages/{types,config,validation,ui}` — código compartido

## Requisitos

- Node ≥ 20
- pnpm ≥ 9
- Docker (opcional, para postgres/redis/minio locales)

## Puesta en marcha

```bash
pnpm install
docker compose up -d          # postgres + redis + minio
cp .env.example .env          # ajustar valores si es necesario
pnpm db:migrate               # crear el esquema de la base de datos
pnpm db:seed                  # datos de demostración
pnpm dev                      # http://localhost:3000
```

## Estructura

- Especificación compacta para agentes IA: `IA_information/IA_agent_info.txt`
- Árbol de directorios detallado: `IA_information/Estructure.txt`
