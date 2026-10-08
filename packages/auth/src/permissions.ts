import type { Role } from './roles';

/** Dashboard path prefix accessible by each role. */
export const ROLE_DASHBOARD_PREFIXES: Record<Role, string> = {
  PLAYER: '/dashboard/player',
  PARENT: '/dashboard/parent',
  COACH: '/dashboard/coach',
  SCOUT: '/dashboard/scout',
  AGENT: '/dashboard/agent',
  CLUB: '/dashboard/club',
  UNIVERSITY: '/dashboard/university',
  SCHOOL: '/dashboard/school',
  ADMIN: '/dashboard/admin',
};

/**
 * Secciones del dashboard compartidas por **cualquier perfil autenticado**, sin
 * prefijo de rol. Es la única forma de exponer un área común (p. ej. Discovery)
 * sin abrir el resto de áreas privadas.
 */
export const SHARED_DASHBOARD_PREFIXES: readonly string[] = ['/dashboard/discovery'];

/** `true` si `pathname` es exactamente `prefix` o una ruta por debajo de él. */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Autorización de rutas del dashboard:
 * - `/dashboard` → cualquier rol.
 * - `/dashboard/<área compartida>/*` → cualquier rol.
 * - `/dashboard/<rol>/*` → solo ese rol.
 *
 * El límite de segmento es intencional: `/dashboard/discovery-x` no es Discovery.
 */
export function canAccessDashboard(role: Role, pathname: string): boolean {
  if (pathname === '/dashboard') return true;
  if (SHARED_DASHBOARD_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return true;
  return matchesPrefix(pathname, ROLE_DASHBOARD_PREFIXES[role]);
}
