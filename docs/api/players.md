# API · Jugadores

## Concepts

- **Profile**: ficha futbolística + física + biografía (`Player`).
- **Estado**: PENDING_VERIFICATION, ACTIVE, AVAILABLE, INACTIVE.
- **Videos**: ligados al jugador con estado de procesado.

## Acciones principales

| Acción | Implementación |
| --- | --- |
| Ver mi perfil | `GET /dashboard/player/profile` (server component) |
| Edit profile | `updatePlayerProfileAction` (zod + prisma) |
| Upload video | `uploadVideoAction` (guarda en `public/uploads`) |
| Aplicar a oportunidad | `applyToOpportunityAction` (upsert `Application`) |
| Marcar notificaciones leídas | `markNotificationsReadAction` |

## Permisos

- Acceso al perfil solo del usuario autenticado.
- Administrador puede cambiar el estado (verificación).
