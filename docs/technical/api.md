# API

La API se implementa con **Server Actions** (mutaciones) y **Route Handlers** de Next.js para REST.

## Route handlers (`apps/web/app/api`)

Estructura: `app/api/<dominio>/route.ts` con GET (listado), POST (creación), y `[id]/route.ts` para GET/PATCH/DELETE.

Dominios disponibles (scaffold): auth, users, players, parents, coaches, scouts, agents, clubs,
academias, universidades, videos, media, training, parent-education, evaluations, development,
pathways, camps, live-sessions, opportunities, applications, submissions, trials, negotiations,
contracts, scouting, matching, documents, communications, notifications, memberships, payments,
analytics, webhooks.

## Server Actions (`apps/web/app/actions`)

- `auth.ts` — login, registro, onboarding, recuperación de contraseña, logout.
- `player.ts` — perfil, subida de vídeo, solicitudes, notificaciones.
- `club.ts` — oportunidades, requisitos, consultas, staff.
- `agent.ts` — jugadores representados, envíos.
- `scout.ts` — informes, guardar jugadores.
- `admin.ts` — verificación, roles, cierre de oportunidades.
- `membership.ts` — upgrade de plan.

## Convenciones

- Respuestas de error: `{ error: string }` con status HTTP correcto.
- Validación con zod (`packages/validation`) antes de tocar la base de datos.
