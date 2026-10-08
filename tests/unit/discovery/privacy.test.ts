import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  privacyFindMany: vi.fn(),
  privacyFindFirst: vi.fn(),
  privacyFindUnique: vi.fn(),
  privacyCreate: vi.fn(),
  privacyUpdate: vi.fn(),
  privacyDelete: vi.fn(),
  followFindUnique: vi.fn(),
  followDeleteMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    privacyRule: {
      findMany: mocks.privacyFindMany,
      findFirst: mocks.privacyFindFirst,
      findUnique: mocks.privacyFindUnique,
      create: mocks.privacyCreate,
      update: mocks.privacyUpdate,
      delete: mocks.privacyDelete,
    },
    follow: { findUnique: mocks.followFindUnique, deleteMany: mocks.followDeleteMany },
  },
}));

import {
  canComment,
  getPrivacyState,
  hasBlockBetween,
  hiddenAuthorIds,
  togglePrivacyRule,
} from '@/lib/discovery-privacy';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.privacyFindMany.mockResolvedValue([]);
  mocks.privacyFindFirst.mockResolvedValue(null);
  mocks.privacyFindUnique.mockResolvedValue(null);
  mocks.privacyCreate.mockResolvedValue({});
  mocks.privacyUpdate.mockResolvedValue({});
  mocks.privacyDelete.mockResolvedValue({});
  mocks.followFindUnique.mockResolvedValue(null);
  mocks.followDeleteMany.mockResolvedValue({ count: 0 });
});

describe('hiddenAuthorIds', () => {
  it('sin espectador no oculta a nadie', async () => {
    await expect(hiddenAuthorIds()).resolves.toEqual([]);
    await expect(hiddenAuthorIds(null)).resolves.toEqual([]);
    expect(mocks.privacyFindMany).not.toHaveBeenCalled();
  });

  it('oculta a los bloqueados en los dos sentidos', async () => {
    mocks.privacyFindMany.mockResolvedValue([
      { ownerId: 'yo', targetId: 'bloqueado-por-mi', kind: 'BLOCK' },
      { ownerId: 'me-bloqueo', targetId: 'yo', kind: 'BLOCK' },
    ]);

    await expect(hiddenAuthorIds('yo')).resolves.toEqual(['bloqueado-por-mi', 'me-bloqueo']);
  });

  it('solo oculta los silenciados por mí (no los que me silencian)', async () => {
    mocks.privacyFindMany.mockResolvedValue([
      { ownerId: 'yo', targetId: 'silenciado', kind: 'MUTE' },
      { ownerId: 'me-silencia', targetId: 'yo', kind: 'MUTE' },
    ]);

    await expect(hiddenAuthorIds('yo')).resolves.toEqual(['silenciado']);
  });
});

describe('hasBlockBetween', () => {
  it('no consulta contigo mismo', async () => {
    await expect(hasBlockBetween('yo', 'yo')).resolves.toBe(false);
    expect(mocks.privacyFindFirst).not.toHaveBeenCalled();
  });

  it('detecta el bloqueo en cualquier sentido', async () => {
    mocks.privacyFindFirst.mockResolvedValue({ id: 'regla' });
    await expect(hasBlockBetween('yo', 'otro')).resolves.toBe(true);

    const where = mocks.privacyFindFirst.mock.calls[0][0].where;
    expect(where.kind).toBe('BLOCK');
    expect(where.OR).toHaveLength(2);
  });
});

describe('getPrivacyState', () => {
  it('sin espectador no hay estado propio', async () => {
    await expect(getPrivacyState('otro')).resolves.toEqual({ blocked: false, muted: false });
  });

  it('refleja lo que he aplicado yo', async () => {
    mocks.privacyFindMany.mockResolvedValue([{ kind: 'MUTE' }]);
    await expect(getPrivacyState('otro', 'yo')).resolves.toEqual({ blocked: false, muted: true });
  });
});

describe('togglePrivacyRule', () => {
  it('no hace nada contigo mismo', async () => {
    await expect(togglePrivacyRule({ ownerId: 'yo', targetId: 'yo', kind: 'BLOCK' })).resolves.toEqual(
      { active: false }
    );
    expect(mocks.privacyCreate).not.toHaveBeenCalled();
  });

  it('crea la regla y corta los seguimientos al bloquear', async () => {
    const result = await togglePrivacyRule({ ownerId: 'yo', targetId: 'otro', kind: 'BLOCK' });

    expect(result).toEqual({ active: true });
    expect(mocks.privacyCreate).toHaveBeenCalledWith({
      data: { ownerId: 'yo', targetId: 'otro', kind: 'BLOCK' },
    });
    expect(mocks.followDeleteMany).toHaveBeenCalledTimes(1);
  });

  it('silenciar no toca los seguimientos', async () => {
    await togglePrivacyRule({ ownerId: 'yo', targetId: 'otro', kind: 'MUTE' });
    expect(mocks.followDeleteMany).not.toHaveBeenCalled();
  });

  it('la misma regla se quita', async () => {
    mocks.privacyFindUnique.mockResolvedValue({ id: 'regla', kind: 'BLOCK' });

    await expect(togglePrivacyRule({ ownerId: 'yo', targetId: 'otro', kind: 'BLOCK' })).resolves.toEqual(
      { active: false }
    );
    expect(mocks.privacyDelete).toHaveBeenCalledWith({ where: { id: 'regla' } });
  });

  it('cambiar de silencio a bloqueo actualiza la regla', async () => {
    mocks.privacyFindUnique.mockResolvedValue({ id: 'regla', kind: 'MUTE' });

    await expect(togglePrivacyRule({ ownerId: 'yo', targetId: 'otro', kind: 'BLOCK' })).resolves.toEqual(
      { active: true }
    );
    expect(mocks.privacyUpdate).toHaveBeenCalledWith({
      where: { id: 'regla' },
      data: { kind: 'BLOCK' },
    });
  });
});

describe('canComment', () => {
  it('el autor siempre puede comentar en lo suyo', async () => {
    await expect(canComment({ viewerId: 'yo', authorId: 'yo', policy: 'NOBODY' })).resolves.toBe(true);
  });

  it('la política NOBODY cierra los comentarios', async () => {
    await expect(canComment({ viewerId: 'yo', authorId: 'otro', policy: 'NOBODY' })).resolves.toBe(false);
  });

  it('un bloqueo impide comentar', async () => {
    mocks.privacyFindFirst.mockResolvedValue({ id: 'regla' });
    await expect(canComment({ viewerId: 'yo', authorId: 'otro', policy: 'EVERYONE' })).resolves.toBe(false);
  });

  it('la política FOLLOWERS exige seguir al autor', async () => {
    await expect(canComment({ viewerId: 'yo', authorId: 'otro', policy: 'FOLLOWERS' })).resolves.toBe(
      false
    );

    mocks.followFindUnique.mockResolvedValue({ id: 'follow' });
    await expect(canComment({ viewerId: 'yo', authorId: 'otro', policy: 'FOLLOWERS' })).resolves.toBe(
      true
    );
  });
});
