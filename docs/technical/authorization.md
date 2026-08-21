# Autorización

RBAC basado en el rol de la sesión (`packages/auth/src/permissions.ts`).

## Reglas

- `ROLE_DASHBOARD_PREFIXES[role]` define el área accesible de cada rol.
- `canAccessDashboard(role, pathname)` comprueba el prefijo.
- El middleware redirige a `/login` sin sesión y a la zona del rol si el área no corresponde.

## Verificación extra por propietario

Las consultas filtran por el recurso del usuario (ej. `prisma.video.findFirst({ where: { id, player: { userId } } })`)
para impedir accesos cruzados aunque se conozca el ID.

## Administración

Las acciones de admin comprueban `session.user.role === 'ADMIN'` antes de ejecutar.
