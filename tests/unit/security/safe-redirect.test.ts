import { describe, expect, it } from 'vitest';
import { dashboardPath } from '@/lib/safe-redirect';

describe('dashboardPath', () => {
  it('acepta rutas internas del dashboard', () => {
    expect(dashboardPath('/dashboard/player')).toBe('/dashboard/player');
    expect(dashboardPath('/dashboard/club/players')).toBe('/dashboard/club/players');
  });

  it('neutraliza URLs externas y escapes', () => {
    expect(dashboardPath('/dashboard')).toBe('/dashboard');
    expect(dashboardPath('https://evil.example')).toBe('/dashboard');
    expect(dashboardPath('//evil.example')).toBe('/dashboard');
    expect(dashboardPath('/dashboard/../admin')).toBe('/dashboard');
    expect(dashboardPath('/dashboard/%2e%2e/admin')).toBe('/dashboard');
    expect(dashboardPath('/dashboard\\evil')).toBe('/dashboard');
    expect(dashboardPath('javascript:alert(1)')).toBe('/dashboard');
    expect(dashboardPath(null)).toBe('/dashboard');
  });
});
