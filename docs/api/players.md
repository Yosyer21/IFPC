# API · Jugadores

## Concepts

- **Profile**: ficha futbolística + física + biografía (`Player`).
- **Personalización**: portada, titular, ubicación, chips de «abierto a» y acento de color;
  checklist de fuerza ponderada (`PROFILE_CHECKLIST`).
- **Estado**: PENDING_VERIFICATION, ACTIVE, AVAILABLE, INACTIVE.
- **Videos**: ligados al jugador con estado de procesado.

## Acciones principales

| Acción                       | Implementación                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Ver mi perfil                | `GET /dashboard/player/profile` (server component)                                     |
| Edit profile                 | `updatePlayerProfileAction` (zod + prisma; incluye titular, ubicación, chips y acento) |
| Subir/quitar portada         | `updateProfileBannerAction` / `removeProfileBannerAction` (driver de almacenamiento)   |
| Upload video                 | `uploadVideoAction` (guarda en `public/uploads`)                                       |
| Aplicar a oportunidad        | `applyToOpportunityAction` (upsert `Application`)                                      |
| Marcar notificaciones leídas | `markNotificationsReadAction`                                                          |

## Permisos

- Acceso al perfil solo del usuario autenticado.
- Administrador puede cambiar el estado (verificación).
