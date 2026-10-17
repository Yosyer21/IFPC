# Autorización

RBAC basado en el rol de la sesión (`packages/auth/src/permissions.ts`).

## Reglas

- `ROLE_DASHBOARD_PREFIXES[role]` define el área accesible de cada rol (incluye `SCHOOL` → `/dashboard/school`).
- `SHARED_DASHBOARD_PREFIXES` lista las **áreas compartidas** que ve cualquier perfil con
  sesión (`/dashboard/discovery`, `/dashboard/live-sessions`, `/dashboard/rooms`,
  `/dashboard/calendar` y `/dashboard/health`). Es la única excepción al guard por rol: así un
  jugador entra a lo que le invita su coach (una sala de vídeo, una sesión anunciada) sin abrir
  el resto de áreas privadas.
- `canAccessDashboard(role, pathname)` comprueba el prefijo **con límite de segmento**
  (`/dashboard/discovery-x` no cuenta como `/dashboard/discovery`).
- El middleware usa esa misma función (una sola fuente de verdad, cubierta por
  `tests/unit/permissions/permissions.test.ts`): redirige a `/login` sin sesión, a `/login`
  si el token no trae un rol reconocible (falla cerrado) y a la zona del rol si el área no
  corresponde.
- Roles actuales: `PLAYER`, `PARENT`, `COACH`, `SCOUT`, `AGENT`, `CLUB`, `UNIVERSITY`, `SCHOOL`, `ADMIN`.

## Verificación extra por propietario

Las consultas filtran por el recurso del usuario (ej. `prisma.video.findFirst({ where: { id, player: { userId } } })`)
para impedir accesos cruzados aunque se conozca el ID.

## Live sessions (quién las ve y quién entra)

`canViewLiveSession` (`apps/web/lib/live-sessions.ts`) decide el acceso a una sesión, y la
misma regla usan las listas de cada área para que nadie vea un enlace que no puede abrir:

- **Admin**: siempre.
- **1:1** (`playerId`): ese jugador y el coach asignado.
- **Pública**: cualquiera (además se anuncia en Discovery).
- **De club** (`visibility = CLUB`, sin `playerId`): el coach anfitrión y los **clubes
  implicados**: el que la organiza (`clubId`) y los clubes con los que trabaja ese coach
  (`coachClubIds`: donde es propietario o staff, y los de los jugadores que entrena). De un
  club implicado entran todos sus miembros (`clubMemberUserIds`: propietario, staff y
  jugadores con contrato firmado o activo).

En la práctica: el **club** ve en `/dashboard/club/live-sessions` las sesiones que
organizan sus entrenadores (`clubCoachIds`) y las públicas, y entra desde ahí a la vista
compartida (`/dashboard/live-sessions/<id>`), donde está el enlace de la sesión. El
**jugador** ve las mismas en `/dashboard/player/live-sessions` (sus 1:1, las públicas, las
de sus clubes y las de sus coaches).

## Administration

Las acciones de admin comprueban `session.user.role === 'ADMIN'` antes de ejecutar.
