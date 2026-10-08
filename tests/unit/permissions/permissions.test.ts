import { describe, expect, it } from 'vitest';
import { canAccessDashboard, ROLE_DASHBOARD_PREFIXES } from '../../../packages/auth/src/permissions';
import { ROLES } from '../../../packages/auth/src/roles';

describe('canAccessDashboard', () => {
  it('allows any role to access the dashboard index', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard')).toBe(true);
    expect(canAccessDashboard('ADMIN', '/dashboard')).toBe(true);
  });

  it('allows each role to access its own area', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard/player/profile')).toBe(true);
    expect(canAccessDashboard('PARENT', '/dashboard/parent/children')).toBe(true);
    expect(canAccessDashboard('COACH', '/dashboard/coach/players')).toBe(true);
    expect(canAccessDashboard('SCOUT', '/dashboard/scout/saved')).toBe(true);
    expect(canAccessDashboard('AGENT', '/dashboard/agent/submissions')).toBe(true);
    expect(canAccessDashboard('CLUB', '/dashboard/club/players')).toBe(true);
    expect(canAccessDashboard('UNIVERSITY', '/dashboard/university/players')).toBe(true);
    expect(canAccessDashboard('SCHOOL', '/dashboard/school/participants')).toBe(true);
    expect(canAccessDashboard('ADMIN', '/dashboard/admin/users')).toBe(true);
  });

  it('niega el acceso cruzado entre roles', () => {
    expect(canAccessDashboard('PLAYER', '/dashboard/club')).toBe(false);
    expect(canAccessDashboard('AGENT', '/dashboard/scout')).toBe(false);
    expect(canAccessDashboard('CLUB', '/dashboard/player')).toBe(false);
  });

  it('abre las áreas compartidas a cualquier perfil', () => {
    for (const role of ROLES) {
      expect(canAccessDashboard(role, '/dashboard/discovery')).toBe(true);
      expect(canAccessDashboard(role, '/dashboard/discovery/abc123')).toBe(true);
    }
  });

  it('respeta el límite de segmento en las áreas compartidas', () => {
    // `/dashboard/discovery-x` NO es la sección compartida `/dashboard/discovery`.
    for (const role of ROLES) {
      expect(canAccessDashboard(role, '/dashboard/discovery-evil')).toBe(false);
    }
    // Y una ruta bajo el área de otro rol sigue cerrada.
    expect(canAccessDashboard('CLUB', '/dashboard/player/discovery')).toBe(false);
    expect(canAccessDashboard('PLAYER', '/dashboard/club/discovery')).toBe(false);
  });

  it('define un prefijo para todos los roles definidos', () => {
    for (const role of ROLES) {
      expect(ROLE_DASHBOARD_PREFIXES[role]).toMatch(/^\/dashboard\//);
    }
  });
});
