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
  ADMIN: '/dashboard/admin',
};

export function canAccessDashboard(role: Role, pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith(ROLE_DASHBOARD_PREFIXES[role]);
}
