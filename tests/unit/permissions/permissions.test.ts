import { describe, expect, it } from 'vitest';
import { canAccessDashboard, ROLE_DASHBOARD_PREFIXES } from '../../../packages/auth/src/permissions';
import { ROLES } from '../../../packages/auth/src/roles';

describe('canAccessDashboard', () => {
  it('permite el acceso al índice del dashboard a cualquier rol', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard')).toBe(true);
    expect(canAccessDashboard('ADMIN', '/dashboard')).toBe(true);
  });

  it('permite a cada rol acceder a su propia área', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard/player/profile')).toBe(true);
    expect(canAccessDashboard('PARENT', '/dashboard/parent/children')).toBe(true);
    expect(canAccessDashboard('COACH', '/dashboard/coach/players')).toBe(true);
    expect(canAccessDashboard('SCOUT', '/dashboard/scout/saved')).toBe(true);
    expect(canAccessDashboard('AGENT', '/dashboard/agent/submissions')).toBe(true);
    expect(canAccessDashboard('CLUB', '/dashboard/club/players')).toBe(true);
    expect(canAccessDashboard('UNIVERSITY', '/dashboard/university/players')).toBe(true);
    expect(canAccessDashboard('ADMIN', '/dashboard/admin/users')).toBe(true);
  });

  it('niega el acceso cruzado entre roles', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard/club')).toBe(false);
    expect(canAccessDashboard('AGENT', '/dashboard/scout')).toBe(false);
    expect(canAccessDashboard('CLUB', '/dashboard/player')).toBe(false);
  });

  it('define un prefijo para todos los roles definidos', () => {
    for (const role of ROLES) {
      expect(ROLE_DASHBOARD_PREFIXES[role]).toMatch(/^\/dashboard\//);
    }
  });
});
