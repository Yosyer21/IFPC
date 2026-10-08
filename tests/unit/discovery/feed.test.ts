import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postFindMany: vi.fn(),
  postFindFirst: vi.fn(),
  commentFindMany: vi.fn(),
  viewUpsert: vi.fn(),
  viewFindMany: vi.fn(),
  followFindMany: vi.fn(),
  followCount: vi.fn(),
  followFindUnique: vi.fn(),
  followGroupBy: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    post: { findMany: mocks.postFindMany, findFirst: mocks.postFindFirst },
    postComment: { findMany: mocks.commentFindMany },
    postView: { upsert: mocks.viewUpsert, findMany: mocks.viewFindMany },
    follow: {
      findMany: mocks.followFindMany,
      count: mocks.followCount,
      findUnique: mocks.followFindUnique,
      groupBy: mocks.followGroupBy,
    },
    user: { findMany: mocks.userFindMany },
  },
}));

import {
  engagementScore,
  extractTags,
  formatRelativeTime,
  getFollowStats,
  getPostViewStats,
  listFeed,
  listSuggestedProfiles,
  parseFeedFilters,
  rankTrendingPosts,
  recordPostView,
  resolveEmbed,
  summarizePostViews,
  trackPostView,
} from '@/lib/discovery';

const NOW = new Date('2026-10-02T12:00:00.000Z');

/** Fila de post tal y como la devuelve Prisma (estructura mínima). */
function row(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    title: null,
    body: 'texto',
    mediaUrl: null,
    mediaKind: null,
    linkUrl: null,
    tags: [],
    pinnedAt: null,
    createdAt: NOW,
    author: { id: 'author-1', name: 'Ana Ruiz', role: 'CLUB', image: null },
    opportunity: null,
    _count: { likes: 0, comments: 0, views: 0 },
    likes: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'viewer-1', role: 'CLUB' } });
  mocks.postFindMany.mockResolvedValue([]);
  mocks.postFindFirst.mockResolvedValue(null);
  mocks.commentFindMany.mockResolvedValue([]);
  mocks.viewUpsert.mockResolvedValue({});
  mocks.viewFindMany.mockResolvedValue([]);
  mocks.followFindMany.mockResolvedValue([]);
  mocks.followCount.mockResolvedValue(0);
  mocks.followFindUnique.mockResolvedValue(null);
  mocks.followGroupBy.mockResolvedValue([]);
  mocks.userFindMany.mockResolvedValue([]);
});

describe('parseFeedFilters', () => {
  it('sin parámetros usa "recent" y sin etiqueta', () => {
    expect(parseFeedFilters({})).toEqual({ tab: 'recent', tag: null });
  });

  it('acepta pestañas conocidas y descarta las desconocidas', () => {
    expect(parseFeedFilters({ tab: 'trending' }).tab).toBe('trending');
    expect(parseFeedFilters({ tab: 'videos' }).tab).toBe('videos');
    expect(parseFeedFilters({ tab: 'inventada' }).tab).toBe('recent');
  });

  it('normaliza la etiqueta y rechaza formatos inválidos', () => {
    expect(parseFeedFilters({ tag: '#SUB-17' }).tag).toBe('sub-17');
    expect(parseFeedFilters({ tag: 'no vale' }).tag).toBeNull();
    expect(parseFeedFilters({ tag: '-raro' }).tag).toBeNull();
    expect(parseFeedFilters({ tag: 'a'.repeat(40) }).tag).toBeNull();
  });
});

describe('extractTags', () => {
  it('saca los hashtags del texto, sin repetir y en minúsculas', () => {
    expect(extractTags('Fichaje #Sub17 y más #sub17 #Portero')).toEqual(['sub17', 'portero']);
  });

  it('une los hashtags del texto con las etiquetas declaradas', () => {
    expect(extractTags('buen #partido', ['#previa'])).toEqual(['previa', 'partido']);
  });

  it('sin texto devuelve lo declarado', () => {
    expect(extractTags(null, ['uno'])).toEqual(['uno']);
    expect(extractTags(null)).toEqual([]);
  });

  it('limita el número de etiquetas', () => {
    expect(extractTags('#uno #dos #tres #cuatro #cinco #seis')).toHaveLength(5);
  });
});

describe('resolveEmbed', () => {
  it('normaliza enlaces de YouTube', () => {
    expect(resolveEmbed('https://www.youtube.com/watch?v=M7lc1UVf-VE')).toBe(
      'https://www.youtube.com/embed/M7lc1UVf-VE'
    );
    expect(resolveEmbed('https://youtu.be/M7lc1UVf-VE')).toBe(
      'https://www.youtube.com/embed/M7lc1UVf-VE'
    );
    expect(resolveEmbed('https://www.youtube.com/shorts/M7lc1UVf-VE')).toBe(
      'https://www.youtube.com/embed/M7lc1UVf-VE'
    );
  });

  it('normaliza enlaces de Vimeo', () => {
    expect(resolveEmbed('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789'
    );
  });

  it('rechaza orígenes fuera de la lista blanca (evita inyectar un iframe)', () => {
    expect(resolveEmbed('https://evil.example/watch?v=M7lc1UVf-VE')).toBeNull();
    expect(resolveEmbed('https://youtube.com.evil.example/watch?v=M7lc1UVf-VE')).toBeNull();
    expect(resolveEmbed('javascript:alert(1)')).toBeNull();
    expect(resolveEmbed('data:text/html,<iframe>')).toBeNull();
  });

  it('rechaza enlaces sin identificador válido', () => {
    expect(resolveEmbed('https://www.youtube.com/watch?v=ab')).toBeNull();
    expect(resolveEmbed('https://vimeo.com/')).toBeNull();
    expect(resolveEmbed(null)).toBeNull();
    expect(resolveEmbed('no-es-una-url')).toBeNull();
  });
});

describe('engagement y ranking', () => {
  it('pondera comentarios por encima del mismo número de likes', () => {
    expect(engagementScore({ counts: { likes: 3, comments: 0, views: 0 } })).toBe(9);
    expect(engagementScore({ counts: { likes: 0, comments: 3, views: 0 } })).toBe(6);
    expect(engagementScore({ counts: { likes: 0, comments: 0, views: 5 } })).toBe(5);
  });

  it('ordena por engagement y desempata por fecha', () => {
    const older = { counts: { likes: 1, comments: 0, views: 0 }, createdAt: new Date('2026-10-01') };
    const newer = { counts: { likes: 1, comments: 0, views: 0 }, createdAt: new Date('2026-10-02') };
    const best = { counts: { likes: 9, comments: 1, views: 0 }, createdAt: new Date('2026-09-01') };

    expect(rankTrendingPosts([older, best, newer])).toEqual([best, newer, older]);
    expect(rankTrendingPosts([older, newer])[0]).toBe(newer);
  });
});

describe('formatRelativeTime', () => {
  it('usa minutos, horas, días o fecha según la antigüedad', () => {
    expect(formatRelativeTime(NOW, NOW)).toBe('ahora');
    expect(formatRelativeTime(new Date(NOW.getTime() - 5 * 60_000), NOW)).toBe('hace 5 min');
    expect(formatRelativeTime(new Date(NOW.getTime() - 3 * 3_600_000), NOW)).toBe('hace 3 h');
    expect(formatRelativeTime(new Date(NOW.getTime() - 2 * 86_400_000), NOW)).toBe('hace 2 d');
    expect(formatRelativeTime(new Date('2026-01-05T10:00:00.000Z'), NOW)).toMatch(/5/);
  });
});

describe('summarizePostViews', () => {
  it('agrega personas, aperturas y desglose por rol', () => {
    expect(
      summarizePostViews([
        { viewerRole: 'SCOUT', viewCount: 3 },
        { viewerRole: 'CLUB', viewCount: 1 },
        { viewerRole: 'SCOUT', viewCount: 2 },
      ])
    ).toEqual({
      viewers: 3,
      views: 6,
      byRole: [
        { role: 'SCOUT', viewers: 2 },
        { role: 'CLUB', viewers: 1 },
      ],
    });
  });
});

describe('listFeed', () => {
  it('filtra por etiqueta y pide una fila extra para el cursor', async () => {
    await listFeed({ viewerId: 'viewer-1', filters: { tab: 'recent', tag: 'sub17' } });

    const args = mocks.postFindMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ status: 'PUBLISHED', tags: { has: 'sub17' } });
    expect(args.take).toBe(21);
    // El "me gusta" se resuelve para el espectador actual.
    expect(args.include.likes).toEqual({ where: { userId: 'viewer-1' }, select: { id: true } });
  });

  it('devuelve cursor cuando hay más de una página', async () => {
    mocks.postFindMany.mockResolvedValue(
      Array.from({ length: 21 }, (_value, index) => row(`post-${index + 1}`))
    );

    const page = await listFeed({ viewerId: 'viewer-1', filters: { tab: 'recent', tag: null } });
    expect(page.posts).toHaveLength(20);
    expect(page.nextCursor).toBe('post-20');
  });

  it('sin más resultados no devuelve cursor', async () => {
    mocks.postFindMany.mockResolvedValue([row('post-1')]);
    const page = await listFeed({ viewerId: 'viewer-1', filters: { tab: 'recent', tag: null } });
    expect(page.nextCursor).toBeNull();
  });

  it('la pestaña de vídeos filtra por tipo', async () => {
    await listFeed({ viewerId: 'viewer-1', filters: { tab: 'videos', tag: null } });
    expect(mocks.postFindMany.mock.calls[0][0].where).toMatchObject({ type: 'VIDEO' });
  });

  it('tendencias ordena por engagement y no pagina', async () => {
    mocks.postFindMany.mockResolvedValue([
      row('poco', { _count: { likes: 0, comments: 0, views: 1 } }),
      row('mucho', { _count: { likes: 5, comments: 1, views: 9 } }),
    ]);

    const page = await listFeed({ viewerId: 'viewer-1', filters: { tab: 'trending', tag: null } });
    expect(page.posts.map((post) => post.id)).toEqual(['mucho', 'poco']);
    expect(page.nextCursor).toBeNull();
  });

  it('marca likedByMe y cuenta las interacciones', async () => {
    mocks.postFindMany.mockResolvedValue([
      row('post-1', {
        likes: [{ id: 'like-1' }],
        _count: { likes: 4, comments: 2, views: 7 },
      }),
    ]);

    const [post] = (await listFeed({ viewerId: 'viewer-1', filters: { tab: 'recent', tag: null } }))
      .posts;
    expect(post?.likedByMe).toBe(true);
    expect(post?.counts).toEqual({ likes: 4, comments: 2, views: 7 });
  });
});

describe('métricas de una publicación', () => {
  it('recordPostView acumula una apertura por espectador', async () => {
    await recordPostView({ postId: 'post-1', viewerUserId: 'viewer-1', viewerRole: 'CLUB' });
    expect(mocks.viewUpsert).toHaveBeenCalledWith({
      where: { postId_viewerUserId: { postId: 'post-1', viewerUserId: 'viewer-1' } },
      update: expect.objectContaining({ viewerRole: 'CLUB', viewCount: { increment: 1 } }),
      create: { postId: 'post-1', viewerUserId: 'viewer-1', viewerRole: 'CLUB' },
    });
  });

  it('recordPostView nunca propaga errores (las métricas no rompen la página)', async () => {
    mocks.viewUpsert.mockRejectedValue(new Error('boom'));
    await expect(
      recordPostView({ postId: 'post-1', viewerUserId: 'viewer-1', viewerRole: 'CLUB' })
    ).resolves.toBeUndefined();
  });

  it('trackPostView no cuenta al propio autor', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'author-1', role: 'CLUB' } });
    await trackPostView({ postId: 'post-1', authorUserId: 'author-1' });
    expect(mocks.viewUpsert).not.toHaveBeenCalled();
  });

  it('trackPostView no hace nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    await trackPostView({ postId: 'post-1', authorUserId: 'author-1' });
    expect(mocks.viewUpsert).not.toHaveBeenCalled();
  });

  it('trackPostView registra la apertura de otro perfil', async () => {
    await trackPostView({ postId: 'post-1', authorUserId: 'author-1' });
    expect(mocks.viewUpsert).toHaveBeenCalledTimes(1);
  });

  it('getPostViewStats agrega el alcance del post', async () => {
    mocks.viewFindMany.mockResolvedValue([
      { viewerRole: 'SCOUT', viewCount: 2 },
      { viewerRole: 'CLUB', viewCount: 1 },
    ]);
    await expect(getPostViewStats('post-1')).resolves.toEqual({
      viewers: 2,
      views: 3,
      byRole: [
        { role: 'SCOUT', viewers: 1 },
        { role: 'CLUB', viewers: 1 },
      ],
    });
  });
});

describe('pestaña Siguiendo', () => {
  it('filtra por los perfiles seguidos y por las publicaciones propias', async () => {
    mocks.followFindMany.mockResolvedValue([
      { followingId: 'author-2' },
      { followingId: 'author-3' },
    ]);

    await listFeed({ viewerId: 'viewer-1', filters: { tab: 'following', tag: null } });

    expect(mocks.postFindMany.mock.calls[0][0].where).toMatchObject({
      status: 'PUBLISHED',
      OR: [{ authorId: { in: ['author-2', 'author-3'] } }, { authorId: 'viewer-1' }],
    });
  });

  it('sin seguir a nadie solo muestra las publicaciones propias', async () => {
    await listFeed({ viewerId: 'viewer-1', filters: { tab: 'following', tag: null } });

    expect(mocks.postFindMany.mock.calls[0][0].where).toMatchObject({
      OR: [{ authorId: 'viewer-1' }],
    });
  });

  it('combina los perfiles seguidos con el filtro de etiqueta', async () => {
    mocks.followFindMany.mockResolvedValue([{ followingId: 'author-2' }]);

    await listFeed({ viewerId: 'viewer-1', filters: { tab: 'following', tag: 'sub17' } });

    const where = mocks.postFindMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ tags: { has: 'sub17' } });
    expect(where.OR).toBeDefined();
  });
});

describe('getFollowStats', () => {
  it('devuelve contadores y si el espectador le sigue', async () => {
    mocks.followCount.mockResolvedValueOnce(3).mockResolvedValueOnce(5);
    mocks.followFindUnique.mockResolvedValue({ id: 'follow-1' });

    await expect(getFollowStats('author-1', 'viewer-1')).resolves.toEqual({
      followers: 3,
      following: 5,
      isFollowing: true,
    });
  });

  it('en el muro propio nunca se es seguidor de uno mismo', async () => {
    const stats = await getFollowStats('viewer-1', 'viewer-1');

    expect(stats.isFollowing).toBe(false);
    expect(mocks.followFindUnique).not.toHaveBeenCalled();
  });

  it('sin seguimiento el estado es falso', async () => {
    await expect(getFollowStats('author-1', 'viewer-1')).resolves.toMatchObject({
      isFollowing: false,
    });
  });
});

describe('listSuggestedProfiles', () => {
  it('excluye los perfiles ya seguidos y a uno mismo', async () => {
    mocks.followFindMany.mockResolvedValue([{ followingId: 'ya-sigo' }]);
    mocks.followGroupBy.mockResolvedValue([
      { followingId: 'ya-sigo', _count: { followingId: 9 } },
      { followingId: 'viewer-1', _count: { followingId: 8 } },
      { followingId: 'nuevo', _count: { followingId: 7 } },
    ]);
    mocks.userFindMany.mockResolvedValue([
      { id: 'nuevo', name: 'Nuevo Perfil', role: 'CLUB', image: null, _count: { posts: 4 } },
    ]);

    const suggestions = await listSuggestedProfiles('viewer-1');

    expect(suggestions).toEqual([
      { id: 'nuevo', name: 'Nuevo Perfil', role: 'CLUB', image: null, followers: 7, posts: 4 },
    ]);
    expect(mocks.userFindMany.mock.calls[0][0].where).toEqual({ id: { in: ['nuevo'] } });
  });

  it('sin candidatos no llega a consultar usuarios', async () => {
    await expect(listSuggestedProfiles('viewer-1')).resolves.toEqual([]);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });
});

