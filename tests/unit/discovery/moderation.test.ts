import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  reportFindMany: vi.fn(),
  postFindMany: vi.fn(),
  logCreate: vi.fn(),
  logFindMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    postReport: { findMany: mocks.reportFindMany },
    post: { findMany: mocks.postFindMany },
    moderationLog: { create: mocks.logCreate, findMany: mocks.logFindMany },
  },
}));

import {
  isModerationAction,
  listModerationLog,
  listReportedPosts,
  logModeration,
} from '@/lib/discovery-moderation';

function report(postId: string, reporter = 'reporter-1') {
  return {
    id: `report-${postId}-${reporter}`,
    postId,
    reason: 'motivo',
    createdAt: new Date('2026-01-01'),
    reporter: { id: reporter, name: `Persona ${reporter}` },
  };
}

function postRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: 'ANNOUNCEMENT',
    status: 'PUBLISHED',
    title: null,
    body: 'texto',
    pinnedAt: null,
    createdAt: new Date('2026-01-01'),
    author: { id: 'author-1', name: 'Ana Ruíz', role: 'CLUB' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reportFindMany.mockResolvedValue([]);
  mocks.postFindMany.mockResolvedValue([]);
  mocks.logCreate.mockResolvedValue({});
  mocks.logFindMany.mockResolvedValue([]);
});

describe('isModerationAction', () => {
  it('acepta las acciones conocidas y rechaza el resto', () => {
    expect(isModerationAction('HIDDEN')).toBe(true);
    expect(isModerationAction('PINNED')).toBe(true);
    expect(isModerationAction('inventada')).toBe(false);
    expect(isModerationAction('')).toBe(false);
  });
});

describe('logModeration', () => {
  it('registra la acción con notas opcionales', async () => {
    await logModeration({ actorId: 'admin-1', postId: 'post-1', action: 'HIDDEN' });

    expect(mocks.logCreate).toHaveBeenCalledWith({
      data: { actorId: 'admin-1', postId: 'post-1', action: 'HIDDEN', notes: null },
    });
  });

  it('no registra acciones desconocidas', async () => {
    await logModeration({ actorId: 'admin-1', postId: 'post-1', action: 'rara' });
    expect(mocks.logCreate).not.toHaveBeenCalled();
  });

  it('nunca propaga errores (la traza no puede romper la moderación)', async () => {
    mocks.logCreate.mockRejectedValue(new Error('boom'));
    await expect(
      logModeration({ actorId: 'admin-1', postId: 'post-1', action: 'PINNED' })
    ).resolves.toBeUndefined();
  });
});

describe('listReportedPosts', () => {
  it('solo mira las denuncias pendientes', async () => {
    await listReportedPosts();

    expect(mocks.reportFindMany.mock.calls[0][0].where).toEqual({ resolvedAt: null });
    expect(mocks.postFindMany).not.toHaveBeenCalled();
  });

  it('agrupa las denuncias por publicación y prioriza las más denunciadas', async () => {
    mocks.reportFindMany.mockResolvedValue([
      report('post-a'),
      report('post-b', 'reporter-1'),
      report('post-b', 'reporter-2'),
      report('post-b', 'reporter-3'),
    ]);
    mocks.postFindMany.mockResolvedValue([postRow('post-a'), postRow('post-b')]);

    const queue = await listReportedPosts();

    expect(queue.map((entry) => entry.id)).toEqual(['post-b', 'post-a']);
    expect(queue[0]?.reports).toHaveLength(3);
    expect(queue[0]?.reports[0]?.reporter.name).toBe('Persona reporter-1');
  });

  it('marca las publicaciones fijadas y las ocultas', async () => {
    mocks.reportFindMany.mockResolvedValue([report('post-a')]);
    mocks.postFindMany.mockResolvedValue([
      postRow('post-a', { pinnedAt: new Date('2026-01-02'), status: 'HIDDEN' }),
    ]);

    const [entry] = await listReportedPosts();

    expect(entry?.pinned).toBe(true);
    expect(entry?.status).toBe('HIDDEN');
  });

  it('ignora denuncias cuyo post ya no existe', async () => {
    mocks.reportFindMany.mockResolvedValue([report('post-borrado')]);
    mocks.postFindMany.mockResolvedValue([]);

    await expect(listReportedPosts()).resolves.toEqual([]);
  });
});

describe('listModerationLog', () => {
  it('devuelve la traza más reciente', async () => {
    await listModerationLog(5);

    const args = mocks.logFindMany.mock.calls[0][0];
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
    expect(args.take).toBe(5);
    expect(args.select.actor).toEqual({ select: { id: true, name: true } });
  });
});
