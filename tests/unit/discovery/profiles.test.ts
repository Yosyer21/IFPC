import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  followFindMany: vi.fn(),
  privacyFindMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    user: { findMany: mocks.userFindMany },
    follow: { findMany: mocks.followFindMany },
    privacyRule: { findMany: mocks.privacyFindMany },
  },
}));

import { listProfiles } from '@/lib/discovery';

function userRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Perfil ${id}`,
    role: 'CLUB',
    image: null,
    _count: { posts: 3, followers: 2 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userFindMany.mockResolvedValue([]);
  mocks.followFindMany.mockResolvedValue([]);
  mocks.privacyFindMany.mockResolvedValue([]);
});

describe('listProfiles', () => {
  it('ordena por actividad y devuelve los contadores', async () => {
    mocks.userFindMany.mockResolvedValue([userRow('u1')]);

    const profiles = await listProfiles({ viewerId: 'viewer-1' });

    const args = mocks.userFindMany.mock.calls[0][0];
    expect(args.orderBy).toEqual([{ posts: { _count: 'desc' } }, { createdAt: 'desc' }]);
    expect(profiles).toEqual([
      {
        id: 'u1',
        name: 'Perfil u1',
        role: 'CLUB',
        image: null,
        posts: 3,
        followers: 2,
        isFollowing: false,
      },
    ]);
  });

  it('marca los perfiles que el espectador ya sigue', async () => {
    mocks.userFindMany.mockResolvedValue([userRow('u1'), userRow('u2')]);
    mocks.followFindMany.mockResolvedValue([{ followingId: 'u2' }]);

    const profiles = await listProfiles({ viewerId: 'viewer-1' });

    expect(profiles.map((profile) => profile.isFollowing)).toEqual([false, true]);
    expect(mocks.followFindMany.mock.calls[0][0].where.followerId).toBe('viewer-1');
  });

  it('busca por nombre y filtra por rol', async () => {
    await listProfiles({ q: 'ana', role: 'CLUB', viewerId: 'viewer-1' });

    expect(mocks.userFindMany.mock.calls[0][0].where).toMatchObject({
      role: 'CLUB',
      name: { contains: 'ana', mode: 'insensitive' },
    });
  });

  it('sin sesión no consulta seguimientos', async () => {
    mocks.userFindMany.mockResolvedValue([userRow('u1')]);

    const profiles = await listProfiles({});

    expect(profiles[0]?.isFollowing).toBe(false);
    expect(mocks.followFindMany).not.toHaveBeenCalled();
  });

  it('excluye a quien el espectador bloqueó o silenció', async () => {
    mocks.privacyFindMany.mockResolvedValue([
      { ownerId: 'viewer-1', targetId: 'bloqueado', kind: 'BLOCK' },
    ]);

    await listProfiles({ viewerId: 'viewer-1' });

    expect(mocks.userFindMany.mock.calls[0][0].where.id).toEqual({ notIn: ['bloqueado'] });
  });

  it('sin usuarios no consulta seguimientos', async () => {
    await listProfiles({ viewerId: 'viewer-1' });
    expect(mocks.followFindMany).not.toHaveBeenCalled();
  });
});
