import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  postCount: vi.fn(),
  commentCount: vi.fn(),
  postFindFirst: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    post: { count: mocks.postCount, findFirst: mocks.postFindFirst },
    postComment: { count: mocks.commentCount },
  },
}));

import {
  GUARDRAIL_MESSAGES,
  containsBannedWord,
  countLinks,
  isDuplicatePost,
  reviewComment,
  reviewPost,
  withinRateLimit,
} from '@/lib/discovery-guardrails';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.postCount.mockResolvedValue(0);
  mocks.commentCount.mockResolvedValue(0);
  mocks.postFindFirst.mockResolvedValue(null);
});

describe('containsBannedWord', () => {
  it('detecta la palabra completa sin distinguir mayúsculas', () => {
    expect(containsBannedWord('Eres un IDIOTA')).toBe(true);
    expect(containsBannedWord('qué mierda de partido')).toBe(true);
  });

  it('no salta con subcadenas ni textos limpios', () => {
    expect(containsBannedWord('un partido intenso')).toBe(false);
    expect(containsBannedWord('idiotez no, pero idiomático sí')).toBe(false);
    expect(containsBannedWord(null)).toBe(false);
  });
});

describe('countLinks', () => {
  it('cuenta los enlaces http(s)', () => {
    expect(countLinks('mira https://a.com y http://b.com')).toBe(2);
    expect(countLinks('sin enlaces')).toBe(0);
    expect(countLinks(undefined)).toBe(0);
  });
});

describe('withinRateLimit', () => {
  it('cuenta publicaciones de la última hora', async () => {
    await expect(withinRateLimit('u1', 'post')).resolves.toBe(true);

    const where = mocks.postCount.mock.calls[0][0].where;
    expect(where.authorId).toBe('u1');
    expect(where.createdAt.gte).toBeInstanceOf(Date);
  });

  it('corta al llegar al límite', async () => {
    mocks.postCount.mockResolvedValue(10);
    mocks.commentCount.mockResolvedValue(30);

    await expect(withinRateLimit('u1', 'post')).resolves.toBe(false);
    await expect(withinRateLimit('u1', 'comment')).resolves.toBe(false);
  });
});

describe('isDuplicatePost', () => {
  it('detecta el mismo texto reciente', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1' });

    await expect(isDuplicatePost('u1', 'hola')).resolves.toBe(true);
    expect(mocks.postFindFirst.mock.calls[0][0].where.body).toBe('hola');
  });

  it('sin texto no consulta nada', async () => {
    await expect(isDuplicatePost('u1', null)).resolves.toBe(false);
    expect(mocks.postFindFirst).not.toHaveBeenCalled();
  });
});

describe('reviewPost', () => {
  it('deja pasar una publicación normal', async () => {
    await expect(reviewPost({ userId: 'u1', title: 'Fichaje', body: 'Buen refuerzo' })).resolves.toBeNull();
  });

  it('corta por ritmo antes que por lo demás', async () => {
    mocks.postCount.mockResolvedValue(99);
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1' });

    await expect(reviewPost({ userId: 'u1', title: null, body: 'x' })).resolves.toEqual({
      reason: 'rate_limit',
    });
  });

  it('detecta duplicados y exceso de enlaces', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1' });
    await expect(reviewPost({ userId: 'u1', title: null, body: 'x' })).resolves.toEqual({
      reason: 'duplicate',
    });

    mocks.postFindFirst.mockResolvedValue(null);
    await expect(
      reviewPost({ userId: 'u1', title: null, body: 'a https://a.com b http://b.com c https://c.com d https://d.com' })
    ).resolves.toEqual({ reason: 'too_many_links' });
  });

  it('marca para revisión el lenguaje prohibido en vez de bloquearlo', async () => {
    await expect(reviewPost({ userId: 'u1', title: 'eres un idiota', body: 'x' })).resolves.toEqual({
      hidden: true,
    });
  });
});

describe('reviewComment', () => {
  it('corta por ritmo y rechaza lenguaje prohibido', async () => {
    mocks.commentCount.mockResolvedValue(30);
    await expect(reviewComment({ userId: 'u1', body: 'hola' })).resolves.toEqual({
      reason: 'rate_limit',
    });

    mocks.commentCount.mockResolvedValue(0);
    await expect(reviewComment({ userId: 'u1', body: 'puta' })).resolves.toEqual({
      reason: 'banned_words',
    });
    await expect(reviewComment({ userId: 'u1', body: 'buen partido' })).resolves.toBeNull();
  });
});

describe('GUARDRAIL_MESSAGES', () => {
  it('cubre todos los motivos con un mensaje para el autor', () => {
    for (const reason of ['rate_limit', 'duplicate', 'too_many_links', 'banned_words'] as const) {
      expect(GUARDRAIL_MESSAGES[reason]).toBeTruthy();
    }
  });
});
