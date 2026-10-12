# API · Jugadores

## Concepts

- **Profile**: ficha futbolística + física + biografía (`Player`).
- **Personalización**: portada, titular, ubicación, chips de «abierto a» y acento de color;
  checklist de fuerza ponderada (`PROFILE_CHECKLIST`).
- **Perfil social**: panel frontal editable (portada y foto desde la cabecera), estadísticas
  deportivas y el muro con sus publicaciones de Discovery.
- **Estado**: PENDING_VERIFICATION, ACTIVE, AVAILABLE, INACTIVE.
- **Videos**: ligados al jugador con estado de procesado.

## Acciones principales

| Acción                       | Implementación                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Ver mi perfil                | `GET /dashboard/player/profile` (panel frontal, estadísticas y muro propio)            |
| Perfil de otro autor         | `GET /dashboard/discovery/u/<userId>` (mismo panel + estadísticas + publicaciones)     |
| Estadísticas                 | `getPlayerStats` (`apps/web/lib/player-stats.ts`)                                      |
| Edit profile                 | `updatePlayerProfileAction` (zod + prisma; incluye titular, ubicación, chips y acento) |
| Subir/quitar portada         | `updateProfileBannerAction` / `removeProfileBannerAction` (driver de almacenamiento)   |
| Upload video                 | `uploadVideoAction` (guarda en `public/uploads`)                                       |
| Aplicar a oportunidad        | `applyToOpportunityAction` (upsert `Application`)                                      |
| Marcar notificaciones leídas | `markNotificationsReadAction`                                                          |

## Permisos

- Acceso al perfil solo del usuario autenticado.
- Administrador puede cambiar el estado (verificación).
