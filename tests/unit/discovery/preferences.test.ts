import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FEED_PREFERENCE_WEIGHTS } from '@ifpc/config';

const mocks = vi.hoisted(() => ({
  preferenceFindMany: vi.fn(),
  preferenceFindUnique: vi.fn(),
  preferenceUpsert: vi.fn(),
  preferenceDeleteMany: vi.fn(),
  followFindMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    authorPreference: {
      findMany: mocks.preferenceFindMany,
      findUnique: mocks.preferenceFindUnique,
      upsert: mocks.preferenceUpsert,
      deleteMany: mocks.preferenceDeleteMany,
    },
    follow: { findMany: mocks.followFindMany },
  },
}));

import {
  authorPreferences,
  downrankedAuthorIds,
  feedPreferenceContext,
  followedAuthorIds,
  getAuthorPreference,
  isPreferenceKind,
  listAuthorPreferences,
  preferenceWeight,
  setAuthorPreference,
} from '@/lib/discovery-preferences';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.preferenceFindMany.mockResolvedValue([]);
  mocks.preferenceFindUnique.mockResolvedValue(null);
  mocks.preferenceUpsert.mockResolvedValue({});
  mocks.preferenceDeleteMany.mockResolvedValue({ count: 1 });
  mocks.followFindMany.mockResolvedValue([]);
});

describe('preferenceWeight', () => {
  it('seguir a alguien ya suma por sí solo', () => {
    expect(preferenceWeight({ isFollowed: true, preference: null })).toBe(
      FEED_PREFERENCE_WEIGHTS.followed
    );
  });

  it('«ver más» suma encima del seguimiento', () => {
    expect(preferenceWeight({ isFollowed: true, preference: 'MORE' })).toBe(
      FEED_PREFERENCE_WEIGHTS.followed + FEED_PREFERENCE_WEIGHTS.more
    );
    expect(preferenceWeight({ isFollowed: false, preference: 'MORE' })).toBe(
      FEED_PREFERENCE_WEIGHTS.more
    );
  });

  it('«ver menos» manda sobre el seguimiento', () => {
    expect(preferenceWeight({ isFollowed: true, preference: 'LESS' })).toBe(
      FEED_PREFERENCE_WEIGHTS.less
    );
    expect(preferenceWeight({ isFollowed: false, preference: 'LESS' })).toBeLessThan(0);
  });

  it('sin seguimiento ni preferencia no pesa', () => {
    expect(preferenceWeight({ isFollowed: false, preference: null })).toBe(0);
  });
});

describe('isPreferenceKind', () => {
  it('solo acepta MORE y LESS', () => {
    expect(isPreferenceKind('MORE')).toBe(true);
    expect(isPreferenceKind('LESS')).toBe(true);
    expect(isPreferenceKind('more')).toBe(false);
    expect(isPreferenceKind('')).toBe(false);
    expect(isPreferenceKind(null)).toBe(false);
  });
});

describe('authorPreferences', () => {
  it('sin espectador no consulta', async () => {
    expect(await authorPreferences(null)).toEqual(new Map());
    expect(mocks.preferenceFindMany).not.toHaveBeenCalled();
  });

  it('indexa las preferencias por autor e ignora valores inválidos', async () => {
    mocks.preferenceFindMany.mockResolvedValue([
      { authorId: 'autor-1', kind: 'MORE' },
      { authorId: 'autor-2', kind: 'RARO' },
      { authorId: 'autor-3', kind: 'LESS' },
    ]);

    const preferences = await authorPreferences('viewer-1');

    expect([...preferences]).toEqual([
      ['autor-1', 'MORE'],
      ['autor-3', 'LESS'],
    ]);
  });
});

describe('followedAuthorIds y downrankedAuthorIds', () => {
  it('devuelve los autores seguidos', async () => {
    mocks.followFindMany.mockResolvedValue([{ followingId: 'club-1' }]);

    const ids = await followedAuthorIds('viewer-1');

    expect([...ids]).toEqual(['club-1']);
    expect(mocks.followFindMany).toHaveBeenCalledWith({
      where: { followerId: 'viewer-1' },
      select: { followingId: true },
    });
  });

  it('separa a quien el espectador ha descartado', async () => {
    mocks.preferenceFindMany.mockResolvedValue([
      { authorId: 'autor-menos', kind: 'LESS' },
      { authorId: 'autor-mas', kind: 'MORE' },
    ]);

    expect(await downrankedAuthorIds('viewer-1')).toEqual(['autor-menos']);
  });
});

describe('feedPreferenceContext', () => {
  it('resuelve el peso de cada autor con seguimiento y preferencia', async () => {
    mocks.followFindMany.mockResolvedValue([{ followingId: 'seguido-1' }]);
    mocks.preferenceFindMany.mockResolvedValue([{ authorId: 'seguido-1', kind: 'MORE' }]);

    const context = await feedPreferenceContext('viewer-1');

    expect(context.weightOf('seguido-1')).toBe(
      FEED_PREFERENCE_WEIGHTS.followed + FEED_PREFERENCE_WEIGHTS.more
    );
    expect(context.weightOf('desconocido')).toBe(0);
  });
});

describe('setAuthorPreference', () => {
  it('guarda con upsert', async () => {
    await setAuthorPreference({ userId: 'viewer-1', authorId: 'autor-1', kind: 'MORE' });

    expect(mocks.preferenceUpsert).toHaveBeenCalledWith({
      where: { userId_authorId: { userId: 'viewer-1', authorId: 'autor-1' } },
      create: { userId: 'viewer-1', authorId: 'autor-1', kind: 'MORE' },
      update: { kind: 'MORE' },
    });
  });

  it('con kind null borra la preferencia', async () => {
    await setAuthorPreference({ userId: 'viewer-1', authorId: 'autor-1', kind: null });

    expect(mocks.preferenceDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1', authorId: 'autor-1' },
    });
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
  });

  it('sobre uno mismo no hace nada', async () => {
    await setAuthorPreference({ userId: 'viewer-1', authorId: 'viewer-1', kind: 'LESS' });

    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
    expect(mocks.preferenceDeleteMany).not.toHaveBeenCalled();
  });
});

describe('getAuthorPreference', () => {
  it('sobre uno mismo devuelve null sin consultar', async () => {
    expect(await getAuthorPreference({ userId: 'viewer-1', authorId: 'viewer-1' })).toBeNull();
    expect(mocks.preferenceFindUnique).not.toHaveBeenCalled();
  });

  it('devuelve la preferencia guardada', async () => {
    mocks.preferenceFindUnique.mockResolvedValue({ kind: 'LESS' });

    expect(await getAuthorPreference({ userId: 'viewer-1', authorId: 'autor-1' })).toBe('LESS');
  });

  it('un valor inválido en la base se trata como sin preferencia', async () => {
    mocks.preferenceFindUnique.mockResolvedValue({ kind: 'RARO' });

    expect(await getAuthorPreference({ userId: 'viewer-1', authorId: 'autor-1' })).toBeNull();
  });
});

describe('listAuthorPreferences', () => {
  it('devuelve las preferencias con el perfil del autor', async () => {
    mocks.preferenceFindMany.mockResolvedValue([
      { kind: 'MORE', author: { id: 'club-1', name: 'Demo Club', role: 'CLUB', image: null } },
      { kind: 'RARO', author: { id: 'x', name: 'X', role: 'CLUB', image: null } },
    ]);

    expect(await listAuthorPreferences('viewer-1')).toEqual([
      { id: 'club-1', name: 'Demo Club', role: 'CLUB', image: null, kind: 'MORE' },
    ]);
  });
});
