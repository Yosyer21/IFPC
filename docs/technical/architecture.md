# Arquitectura

## Monorepo (pnpm + Turborepo)

- **`apps/web`** — Next.js 15 (App Router, TypeScript, Tailwind). Páginas por rol bajo `/dashboard`.
- **`apps/worker`** — Node + BullMQ/Redis. Jobs de vídeo, matching, notificaciones, reportes y mantenimiento.
- **`packages/database`** — Prisma + PostgreSQL (modelos en `prisma/schema.prisma`, cliente singleton).
- **`packages/auth`** — Auth.js v5 (credentials, JWT + rol), RBAC y entrada edge-safe para middleware.
- **`packages/matching`** — Motor de scoring puro (0-100) con explicación por criterio.
- **`packages/{types,config,validation,ui}`** — tipos, constantes, schemas zod y componentes compartidos.

## Flujo de datos

- Las páginas server components leen de Prisma directamente (vía `packages/database`).
- Las mutaciones usan **Server Actions** con validación zod.
- Tareas pesadas/asíncronas se encolan en BullMQ y las procesa `apps/worker`.

## Security por capas

1. Middleware (edge): sesión JWT + guard por rol.
2. Layout del dashboard: verificación de sesión en servidor.
3. Acciones: validación zod + comprobación de rol/sesión.
4. Base de datos: Prisma Client con consultas parametrizadas.
