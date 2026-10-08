import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  postFindMany: vi.fn(),
  postCount: vi.fn(),
  reportCount: vi.fn(),
  reportFindMany: vi.fn(),
  viewFindMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    post: { findMany: mocks.postFindMany, count: mocks.postCount },
    postReport: { count: mocks.reportCount, findMany: mocks.reportFindMany },
    postView: { findMany: mocks.viewFindMany },
  },
}));

import {
  averageResolutionHours,
  bestPostingHour,
  bucketPostsByDay,
  countTags,
  getAuthorAnalytics,
  getFeedHealth,
  summarizeAuthorAnalytics,
  type AuthorPostRow,
} from '@/lib/discovery-analytics';

const NOW = new Date('2026-10-08T12:00:00.000Z');
const daysAgo = (days: number, hours = 0) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);

function postRow(overrides: Partial<AuthorPostRow> = {}): AuthorPostRow {
  return {
    id: 'post-1',
    label: 'Publicación',
    tags: [],
    createdAt: NOW,
    likes: 0,
    comments: 0,
    viewers: 0,
    anonymousViews: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.postFindMany.mockResolvedValue([]);
  mocks.postCount.mockResolvedValue(0);
  mocks.reportCount.mockResolvedValue(0);
  mocks.reportFindMany.mockResolvedValue([]);
  mocks.viewFindMany.mockResolvedValue([]);
});

describe('summarizeAuthorAnalytics', () => {
  it('sin publicaciones devuelve todo a cero', () => {
    expect(summarizeAuthorAnalytics([])).toEqual({
      posts: 0,
      reach: 0,
      anonymousOpenings: 0,
      likes: 0,
      comments: 0,
      engagement: 0,
      topPosts: [],
      topTags: [],
      bestHour: null,
    });
  });

  it('suma alcance, anónimas y engagement', () => {
    const analytics = summarizeAuthorAnalytics([
      postRow({ likes: 3, comments: 1, viewers: 2, anonymousViews: 5 }),
      postRow({ id: 'post-2', likes: 1, comments: 0, viewers: 1 }),
    ]);

    expect(analytics.posts).toBe(2);
    expect(analytics.reach).toBe(3);
    expect(analytics.anonymousOpenings).toBe(5);
    expect(analytics.likes).toBe(4);
    expect(analytics.comments).toBe(1);
    // (3*3 + 1*2 + 2) + (1*3 + 0 + 1) = 13 + 4
    expect(analytics.engagement).toBe(17);
  });

  it('ordena las publicaciones por interacción y recorta a cinco', () => {
    const rows = Array.from({ length: 7 }, (_value, index) =>
      postRow({ id: `post-${index}`, likes: index })
    );

    const { topPosts } = summarizeAuthorAnalytics(rows);

    expect(topPosts).toHaveLength(5);
    expect(topPosts[0]?.id).toBe('post-6');
    expect(topPosts.map((post) => post.score)).toEqual([18, 15, 12, 9, 6]);
  });

  it('cuenta etiquetas con desempate alfabético', () => {
    const analytics = summarizeAuthorAnalytics([
      postRow({ tags: ['sub17', 'portero'] }),
      postRow({ id: 'post-2', tags: ['sub17'] }),
      postRow({ id: 'post-3', tags: ['aviso'] }),
    ]);

    expect(analytics.topTags).toEqual([
      { tag: 'sub17', posts: 2 },
      { tag: 'aviso', posts: 1 },
      { tag: 'portero', posts: 1 },
    ]);
  });
});

describe('bestPostingHour', () => {
  it('sin datos no hay hora', () => {
    expect(bestPostingHour([])).toBeNull();
  });

  it('elige la hora con mejor engagement medio', () => {
    expect(
      bestPostingHour([
        { createdAt: new Date('2026-10-01T09:00:00.000Z'), score: 10 },
        { createdAt: new Date('2026-10-02T09:00:00.000Z'), score: 20 },
        { createdAt: new Date('2026-10-01T18:00:00.000Z'), score: 40 },
      ])
    ).toBe(18);
  });
});

describe('countTags', () => {
  it('limita el número de etiquetas', () => {
    expect(countTags([['a'], ['b'], ['c']], 2)).toHaveLength(2);
  });
});

describe('bucketPostsByDay', () => {
  it('rellena los días sin actividad', () => {
    const buckets = bucketPostsByDay([NOW, daysAgo(1)], 3, NOW);

    expect(buckets).toHaveLength(3);
    expect(buckets.at(-1)?.posts).toBe(1);
    expect(buckets[0]?.posts).toBe(0);
  });

  it('ignora fechas fuera de la ventana', () => {
    const buckets = bucketPostsByDay([daysAgo(30)], 7, NOW);
    expect(buckets.reduce((sum, day) => sum + day.posts, 0)).toBe(0);
  });
});

describe('averageResolutionHours', () => {
  it('sin denuncias atendidas no hay media', () => {
    expect(averageResolutionHours([])).toBeNull();
    expect(averageResolutionHours([{ createdAt: NOW, resolvedAt: null }])).toBeNull();
  });

  it('calcula la media y redondea a un decimal', () => {
    expect(
      averageResolutionHours([
        { createdAt: daysAgo(0, 2), resolvedAt: NOW },
        { createdAt: daysAgo(0, 5), resolvedAt: NOW },
      ])
    ).toBe(3.5);
  });
});

describe('getAuthorAnalytics', () => {
  it('sin publicaciones no consulta vistas', async () => {
    await expect(getAuthorAnalytics('author-1')).resolves.toMatchObject({ posts: 0 });
    expect(mocks.viewFindMany).not.toHaveBeenCalled();
  });

  it('separa las aperturas anónimas de las identificables', async () => {
    mocks.postFindMany.mockResolvedValue([
      {
        id: 'post-1',
        title: 'Anuncio',
        body: null,
        tags: [],
        createdAt: NOW,
        _count: { likes: 2, comments: 1 },
      },
    ]);
    mocks.viewFindMany.mockResolvedValue([
      { postId: 'post-1', viewerUserId: 'viewer-1', viewCount: 3 },
      { postId: 'post-1', viewerUserId: 'anonymous', viewCount: 9 },
    ]);

    const analytics = await getAuthorAnalytics('author-1');

    expect(analytics.reach).toBe(1);
    expect(analytics.anonymousOpenings).toBe(9);
    expect(analytics.topPosts[0]?.label).toBe('Anuncio');
  });
});

describe('getFeedHealth', () => {
  it('resume el estado del feed', async () => {
    mocks.postCount.mockResolvedValueOnce(20).mockResolvedValueOnce(3);
    mocks.reportCount.mockResolvedValue(2);
    mocks.reportFindMany.mockResolvedValue([{ createdAt: daysAgo(0, 4), resolvedAt: NOW }]);
    mocks.postFindMany
      .mockResolvedValueOnce([{ createdAt: NOW }, { createdAt: daysAgo(1) }])
      .mockResolvedValueOnce([{ tags: ['sub17'] }, { tags: ['sub17', 'aviso'] }])
      .mockResolvedValueOnce([{ authorId: 'a' }, { authorId: 'b' }, { authorId: 'a' }]);

    const health = await getFeedHealth(NOW);

    expect(health.published).toBe(20);
    expect(health.hidden).toBe(3);
    expect(health.pendingReports).toBe(2);
    expect(health.reportRatePer100).toBe(10);
    expect(health.activeAuthors).toBe(3);
    expect(health.postsByDay).toHaveLength(14);
    expect(health.topTags[0]).toEqual({ tag: 'sub17', posts: 2 });
    expect(health.averageResolutionHours).toBe(4);
  });

  it('sin publicaciones la tasa de denuncia es cero', async () => {
    const health = await getFeedHealth(NOW);
    expect(health.reportRatePer100).toBe(0);
    expect(health.averageResolutionHours).toBeNull();
  });
});
