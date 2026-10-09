import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    postNotInterested: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}));

import {
  isNotInterested,
  notInterestedPostIds,
  setNotInterested,
} from '@/lib/discovery-interest';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([]);
  mocks.findUnique.mockResolvedValue(null);
  mocks.upsert.mockResolvedValue({});
  mocks.deleteMany.mockResolvedValue({ count: 1 });
});

describe('notInterestedPostIds', () => {
  it('sin espectador no consulta nada', async () => {
    expect(await notInterestedPostIds(null)).toEqual([]);
    expect(await notInterestedPostIds(undefined)).toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('devuelve los ids que marcó el espectador', async () => {
    mocks.findMany.mockResolvedValue([{ postId: 'post-1' }, { postId: 'post-2' }]);

    expect(await notInterestedPostIds('user-1')).toEqual(['post-1', 'post-2']);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { postId: true },
    });
  });
});

describe('isNotInterested', () => {
  it('sin espectador es falso', async () => {
    expect(await isNotInterested({ postId: 'post-1' })).toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('busca la marca por publicación y espectador', async () => {
    expect(await isNotInterested({ postId: 'post-1', viewerId: 'user-1' })).toBe(false);

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 'post-1', userId: 'user-1' } },
      select: { id: true },
    });

    mocks.findUnique.mockResolvedValue({ id: 'marca-1' });
    expect(await isNotInterested({ postId: 'post-1', viewerId: 'user-1' })).toBe(true);
  });
});

describe('setNotInterested', () => {
  it('marca con upsert (idempotente)', async () => {
    await setNotInterested({ postId: 'post-1', userId: 'user-1', value: true });

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 'post-1', userId: 'user-1' } },
      create: { postId: 'post-1', userId: 'user-1' },
      update: {},
    });
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it('desmarca borrando su propia fila', async () => {
    await setNotInterested({ postId: 'post-1', userId: 'user-1', value: false });

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { postId: 'post-1', userId: 'user-1' },
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
