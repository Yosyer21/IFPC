import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    notification: { findFirst: mocks.findFirst, update: mocks.update, create: mocks.create },
  },
}));

import {
  NOTIFICATION_GROUP_WINDOW_HOURS,
  notifyGrouped,
  notifyUser,
} from '@/lib/notifications/notify';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findFirst.mockResolvedValue(null);
  mocks.update.mockResolvedValue({});
  mocks.create.mockResolvedValue({});
});

describe('notifyUser', () => {
  it('crea el aviso tal cual', async () => {
    await notifyUser({ userId: 'u1', type: 'post_like', title: 'Nuevo', message: 'hola', link: '/x' });

    expect(mocks.create).toHaveBeenCalledWith({
      data: { userId: 'u1', type: 'post_like', title: 'Nuevo', message: 'hola', link: '/x' },
    });
  });

  it('rellena con null lo que no se envía', async () => {
    await notifyUser({ userId: 'u1', type: 'post_like', title: 'Nuevo' });
    expect(mocks.create).toHaveBeenCalledWith({
      data: { userId: 'u1', type: 'post_like', title: 'Nuevo', message: null, link: null },
    });
  });
});

describe('notifyGrouped', () => {
  it('crea el aviso si no hay uno pendiente del mismo tipo y destino', async () => {
    await notifyGrouped({ userId: 'u1', type: 'post_like', title: 'Nuevos me gusta', link: '/post/1' });

    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        type: 'post_like',
        title: 'Nuevos me gusta',
        message: null,
        link: '/post/1',
      },
    });
  });

  it('solo agrupa dentro de la ventana y sin leer', async () => {
    await notifyGrouped({ userId: 'u1', type: 'post_like', title: 'Nuevos me gusta', link: '/post/1' });

    const where = mocks.findFirst.mock.calls[0][0].where;
    expect(where).toMatchObject({ userId: 'u1', type: 'post_like', link: '/post/1', read: false });

    const since = where.createdAt.gte as Date;
    const expected = Date.now() - NOTIFICATION_GROUP_WINDOW_HOURS * 60 * 60 * 1000;
    expect(Math.abs(since.getTime() - expected)).toBeLessThan(5000);
  });

  it('incrementa el contador del aviso existente con el mensaje agrupado', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'n1', count: 2 });

    await notifyGrouped({
      userId: 'u1',
      type: 'post_like',
      title: 'Nuevos me gusta',
      message: 'Ana te dio me gusta.',
      link: '/post/1',
      groupMessage: (count) => `A ${count} personas les gusta tu publicación.`,
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: {
        count: 3,
        message: 'A 3 personas les gusta tu publicación.',
        createdAt: expect.any(Date),
      },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('sin mensaje agrupado mantiene el del evento', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'n1', count: 1 });

    await notifyGrouped({ userId: 'u1', type: 'post_like', title: 't', message: 'evento', link: '/x' });

    expect(mocks.update.mock.calls[0][0].data.message).toBe('evento');
  });

  it('si la agrupación falla, cae al aviso simple (nunca se pierde)', async () => {
    mocks.findFirst.mockRejectedValue(new Error('boom'));

    await notifyGrouped({ userId: 'u1', type: 'post_like', title: 't', link: '/x' });

    expect(mocks.create).toHaveBeenCalled();
  });
});
