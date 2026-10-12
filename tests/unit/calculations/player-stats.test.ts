import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  evaluationGroupBy: vi.fn(),
  evaluationCount: vi.fn(),
  careerAggregate: vi.fn(),
  careerFindMany: vi.fn(),
  videoCount: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    evaluation: { groupBy: mocks.evaluationGroupBy, count: mocks.evaluationCount },
    careerEntry: { aggregate: mocks.careerAggregate, findMany: mocks.careerFindMany },
    video: { count: mocks.videoCount },
  },
}));

import { getPlayerStats } from '@/lib/player-stats';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.evaluationGroupBy.mockResolvedValue([]);
  mocks.evaluationCount.mockResolvedValue(0);
  mocks.careerAggregate.mockResolvedValue({
    _count: { _all: 0 },
    _sum: { appearances: null, goals: null, assists: null },
  });
  mocks.careerFindMany.mockResolvedValue([]);
  mocks.videoCount.mockResolvedValue(0);
});

describe('getPlayerStats', () => {
  it('sin datos deja todo a cero y sin level global', async () => {
    await expect(getPlayerStats('player-1')).resolves.toEqual({
      overall: null,
      evaluations: 0,
      categories: [],
      career: { entries: 0, seasons: 0, appearances: 0, goals: 0, assists: 0 },
      videos: 0,
    });
  });

  it('pondera la media global por número de evaluations y ordena por level', async () => {
    mocks.evaluationGroupBy.mockResolvedValue([
      { category: 'technical', _avg: { score: 8 }, _count: { _all: 1 } },
      { category: 'physical', _avg: { score: 6 }, _count: { _all: 3 } },
    ]);
    mocks.evaluationCount.mockResolvedValue(4);

    const stats = await getPlayerStats('player-1');
    expect(stats.evaluations).toBe(4);
    expect(stats.overall).toBe(6.5);
    expect(stats.categories.map((entry) => entry.category)).toEqual(['technical', 'physical']);
    expect(stats.categories[0]).toMatchObject({ label: 'Technique', average: 8, count: 1 });
  });

  it('suma la trayectoria y cuenta seasons distintas', async () => {
    mocks.careerAggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { appearances: 42, goals: 12, assists: 7 },
    });
    mocks.careerFindMany.mockResolvedValue([{ season: '2024/25' }, { season: '2023/24' }]);

    const stats = await getPlayerStats('player-1');
    expect(stats.career).toEqual({
      entries: 3,
      seasons: 2,
      appearances: 42,
      goals: 12,
      assists: 7,
    });
  });

  it('descarta categories sin evaluations y redondea a una decimal', async () => {
    mocks.evaluationGroupBy.mockResolvedValue([
      { category: 'tactical', _avg: { score: 7.06 }, _count: { _all: 2 } },
      { category: 'psychological', _avg: { score: null }, _count: { _all: 0 } },
    ]);
    mocks.evaluationCount.mockResolvedValue(2);
    mocks.videoCount.mockResolvedValue(4);

    const stats = await getPlayerStats('player-1');
    expect(stats.categories).toHaveLength(1);
    expect(stats.categories[0]).toMatchObject({ label: 'Tactics', average: 7.1 });
    expect(stats.overall).toBe(7.1);
    expect(stats.videos).toBe(4);
  });

  it('usa la clave como tag si la category no está en el catálogo', async () => {
    mocks.evaluationGroupBy.mockResolvedValue([
      { category: 'leadership', _avg: { score: 5 }, _count: { _all: 1 } },
    ]);
    mocks.evaluationCount.mockResolvedValue(1);

    const stats = await getPlayerStats('player-1');
    expect(stats.categories[0].label).toBe('leadership');
  });
});
