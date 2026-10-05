import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  upsert: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: { profileView: { upsert: mocks.upsert, findMany: mocks.findMany } },
}));

import {
  getProfileViewStats,
  recordProfileView,
  summarizeProfileViews,
  trackProfileView,
} from '@/lib/profile-views';

const NOW = new Date('2026-10-02T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
const row = (viewerRole: string, viewCount = 1, firstDays = 1) => ({
  viewerRole,
  viewCount,
  firstViewedAt: daysAgo(firstDays),
  lastViewedAt: daysAgo(1),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'viewer-1', role: 'CLUB' } });
  mocks.upsert.mockResolvedValue({});
  mocks.findMany.mockResolvedValue([]);
});

describe('summarizeProfileViews', () => {
  it('sin visitas devuelve ceros', () => {
    expect(summarizeProfileViews([], NOW)).toEqual({
      viewers: 0,
      views: 0,
      newThisWeek: 0,
      byRole: [],
    });
  });

  it('cuenta visitantes únicos, visitas totales y desglose por rol', () => {
    const stats = summarizeProfileViews(
      [row('CLUB', 3, 1), row('CLUB', 1, 2), row('SCOUT', 2, 3)],
      NOW
    );

    expect(stats.viewers).toBe(3);
    expect(stats.views).toBe(6);
    expect(stats.byRole).toEqual([
      { role: 'CLUB', viewers: 2 },
      { role: 'SCOUT', viewers: 1 },
    ]);
  });

  it('solo cuenta como nuevos los visitantes de los últimos 7 días', () => {
    const stats = summarizeProfileViews([row('CLUB', 1, 6), row('SCOUT', 1, 8)], NOW);
    expect(stats.newThisWeek).toBe(1);
  });
});

describe('recordProfileView', () => {
  it('incrementa el contador del visitante (upsert)', async () => {
    await recordProfileView({ playerId: 'p1', viewerUserId: 'u1', viewerRole: 'CLUB' });

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { playerId_viewerUserId: { playerId: 'p1', viewerUserId: 'u1' } },
      update: {
        viewerRole: 'CLUB',
        viewCount: { increment: 1 },
        lastViewedAt: expect.any(Date),
      },
      create: { playerId: 'p1', viewerUserId: 'u1', viewerRole: 'CLUB' },
    });
  });

  it('nunca propaga errores de métricas', async () => {
    mocks.upsert.mockRejectedValue(new Error('db down'));
    await expect(
      recordProfileView({ playerId: 'p1', viewerUserId: 'u1', viewerRole: 'CLUB' })
    ).resolves.toBeUndefined();
  });
});

describe('trackProfileView', () => {
  it('registra la visita de un rol profesional', async () => {
    await trackProfileView({ playerId: 'p1', ownerUserId: 'owner-1' });

    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0]![0].create).toEqual({
      playerId: 'p1',
      viewerUserId: 'viewer-1',
      viewerRole: 'CLUB',
    });
  });

  it('ignora al dueño del perfil', async () => {
    await trackProfileView({ playerId: 'p1', ownerUserId: 'viewer-1' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('ignora roles no profesionales (jugadores, familias, admin)', async () => {
    for (const role of ['PLAYER', 'PARENT', 'ADMIN']) {
      mocks.auth.mockResolvedValue({ user: { id: 'viewer-1', role } });
      await trackProfileView({ playerId: 'p1', ownerUserId: 'owner-1' });
    }
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('no registra nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    await trackProfileView({ playerId: 'p1', ownerUserId: 'owner-1' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

describe('getProfileViewStats', () => {
  it('consulta las visitas del jugador y las resume', async () => {
    mocks.findMany.mockResolvedValue([row('CLUB', 2, 1), row('SCOUT', 1, 30)]);

    const stats = await getProfileViewStats('p1');

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { playerId: 'p1' },
      orderBy: { lastViewedAt: 'desc' },
      select: {
        viewerRole: true,
        viewCount: true,
        firstViewedAt: true,
        lastViewedAt: true,
      },
    });
    expect(stats.viewers).toBe(2);
    expect(stats.views).toBe(3);
    expect(stats.newThisWeek).toBe(1);
  });
});
