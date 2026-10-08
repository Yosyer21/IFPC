# Autorización

RBAC basado en el rol de la sesión (`packages/auth/src/permissions.ts`).

## Reglas

- `ROLE_DASHBOARD_PREFIXES[role]` define el área accesible de cada rol (incluye `SCHOOL` → `/dashboard/school`).
- `SHARED_DASHBOARD_PREFIXES` lista las **áreas compartidas** que ve cualquier perfil con
  sesión (`/dashboard/discovery`). Es la única excepción al guard por rol.
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

## Administration

Las acciones de admin comprueban `session.user.role === 'ADMIN'` antes de ejecutar.
