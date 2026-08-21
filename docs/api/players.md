# API · Jugadores

## Conceptos

- **Perfil**: ficha futbolística + física + biografía (`Player`).
- **Estado**: PENDING_VERIFICATION, ACTIVE, AVAILABLE, INACTIVE.
- **Vídeos**: ligados al jugador con estado de procesado.

## Acciones principales

| Acción | Implementación |
| --- | --- |
| Ver mi perfil | `GET /dashboard/player/profile` (server component) |
| Editar perfil | `updatePlayerProfileAction` (zod + prisma) |
| Subir vídeo | `uploadVideoAction` (guarda en `public/uploads`) |
| Aplicar a oportunidad | `applyToOpportunityAction` (upsert `Application`) |
| Marcar notificaciones leídas | `markNotificationsReadAction` |

## Permisos

- Acceso al perfil solo del usuario autenticado.
- Administrador puede cambiar el estado (verificación).
