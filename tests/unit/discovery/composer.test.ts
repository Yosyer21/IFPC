import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postFindMany: vi.fn(),
  postUpdateMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    post: { findMany: mocks.postFindMany, updateMany: mocks.postUpdateMany },
  },
}));

import {
  countPollVotes,
  extractMentions,
  POST_GALLERY_MAX,
  toFeedPost,
  type FeedRow,
} from '@/lib/discovery-content';
import { listDrafts } from '@/lib/discovery';
import { publishDuePosts } from '@/lib/discovery-scheduler';

const NOW = new Date('2026-08-10T09:00:00.000Z');

/** Fila de post tal y como la devuelve Prisma (estructura mínima). */
function row(overrides: Partial<FeedRow> = {}): FeedRow {
  return {
    id: 'post-1',
    type: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    title: null,
    body: 'texto',
    mediaUrl: null,
    mediaKind: null,
    linkUrl: null,
    tags: [],
    commentsPolicy: 'EVERYONE',
    mediaUrls: [],
    mediaAlt: null,
    posterUrl: null,
    publishAt: null,
    pollOptions: [],
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
  mocks.postUpdateMany.mockResolvedValue({ count: 0 });
});

describe('extractMentions', () => {
  it('sin texto no hay menciones', () => {
    expect(extractMentions(null)).toEqual([]);
    expect(extractMentions(undefined)).toEqual([]);
    expect(extractMentions('')).toEqual([]);
  });

  it('extrae el nombre de dos palabras típico del directorio', () => {
    expect(extractMentions('Gracias @Demo Club por la convocatoria')).toEqual(['Demo Club']);
  });

  it('admite nombres de una sola palabra', () => {
    expect(extractMentions('bien jugado @Ana')).toEqual(['Ana']);
  });

  it('ignora la arroba suelta y el correo electrónico', () => {
    expect(extractMentions('escribe @ y mándame un mail a ana@club.com')).toEqual([]);
  });

  it('no repite el mismo nombre y respeta el límite', () => {
    expect(extractMentions('@Ana y otra vez @Ana')).toEqual(['Ana']);
    expect(extractMentions('@Aaa @Bbb @Ccc @Ddd @Eee @Fff', 3)).toEqual(['Aaa', 'Bbb', 'Ccc']);
  });

  it('corta el nombre en dos palabras para no tragarse la frase', () => {
    expect(extractMentions('hola @Ana Ruiz qué tal')).toEqual(['Ana Ruiz']);
  });
});

describe('countPollVotes', () => {
  it('reparte los votos por opción en orden', () => {
    expect(countPollVotes(3, [{ optionIndex: 0 }, { optionIndex: 2 }, { optionIndex: 2 }])).toEqual([
      1, 0, 2,
    ]);
  });

  it('sin votos devuelve ceros', () => {
    expect(countPollVotes(2, [])).toEqual([0, 0]);
  });

  it('ignora opciones fuera de rango', () => {
    expect(countPollVotes(1, [{ optionIndex: 5 }])).toEqual([0]);
  });
});

describe('toFeedPost con los campos del compositor', () => {
  it('la galería y el texto alternativo llegan al feed', () => {
    const post = toFeedPost(
      row({ mediaUrls: ['/uploads/posts/a.png', '/uploads/posts/b.png'], mediaAlt: 'Entreno' })
    );

    expect(post.mediaUrls).toHaveLength(2);
    expect(post.mediaAlt).toBe('Entreno');
  });

  it('cuenta los votos de la encuesta y marca el voto propio', () => {
    const post = toFeedPost(
      row({
        pollOptions: ['Sí', 'No'],
        pollVotes: [
          { optionIndex: 1, userId: 'viewer-1' },
          { optionIndex: 1, userId: 'otro' },
          { optionIndex: 0, userId: 'tercero' },
        ],
      }),
      'viewer-1'
    );

    expect(post.pollCounts).toEqual([1, 2]);
    expect(post.myPollVote).toBe(1);
  });

  it('sin espectador no hay voto propio', () => {
    const post = toFeedPost(
      row({ pollOptions: ['Sí'], pollVotes: [{ optionIndex: 0, userId: 'viewer-1' }] })
    );

    expect(post.pollCounts).toEqual([1]);
    expect(post.myPollVote).toBeNull();
  });

  it('un borrador programado conserva su fecha para el panel del autor', () => {
    const publishAt = new Date('2026-09-01T10:00:00.000Z');
    const post = toFeedPost(row({ status: 'DRAFT', publishAt }));

    expect(post.scheduledAt).toEqual(publishAt);
    expect(post.status).toBe('DRAFT');
  });

  it('la miniatura del vídeo llega al feed', () => {
    const post = toFeedPost(
      row({ mediaKind: 'video', posterUrl: '/uploads/posts/v-poster.jpg' })
    );

    expect(post.posterUrl).toBe('/uploads/posts/v-poster.jpg');
  });

  it('sin miniatura el feed recibe null', () => {
    expect(toFeedPost(row({ mediaKind: 'video' })).posterUrl).toBeNull();
  });
});

describe('listDrafts', () => {
  it('pide solo los borradores del autor, del más reciente al más antiguo', async () => {
    await listDrafts('user-1', 5);

    expect(mocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1', status: 'DRAFT' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    );
  });

  it('devuelve los borradores ya normalizados', async () => {
    mocks.postFindMany.mockResolvedValue([
      row({ id: 'draft-1', status: 'DRAFT', body: 'pendiente' }),
    ]);

    const drafts = await listDrafts('user-1');

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.status).toBe('DRAFT');
    expect(drafts[0]?.myPollVote).toBeNull();
  });
});

describe('publishDuePosts', () => {
  it('sin programadas no toca nada', async () => {
    mocks.postFindMany.mockResolvedValue([]);

    const published = await publishDuePosts(NOW);

    expect(published).toEqual([]);
    expect(mocks.postUpdateMany).not.toHaveBeenCalled();
  });

  it('publica las programadas cuya hora ya pasó', async () => {
    mocks.postFindMany.mockResolvedValue([{ id: 'post-1' }, { id: 'post-2' }]);

    const published = await publishDuePosts(NOW);

    expect(mocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'DRAFT', publishAt: { not: null, lte: NOW } },
      })
    );
    expect(mocks.postUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['post-1', 'post-2'] } },
      data: { status: 'PUBLISHED' },
    });
    expect(published).toEqual([{ id: 'post-1' }, { id: 'post-2' }]);
  });
});

describe('POST_GALLERY_MAX', () => {
  it('limita la galería a cuatro imágenes', () => {
    expect(POST_GALLERY_MAX).toBe(4);
  });
});
