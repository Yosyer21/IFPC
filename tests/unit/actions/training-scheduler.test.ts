import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  contentFindMany: vi.fn(),
  contentUpdate: vi.fn(),
  coachPlayerFindMany: vi.fn(),
  contractFindMany: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    trainingContent: { findMany: mocks.contentFindMany, update: mocks.contentUpdate },
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    contract: { findMany: mocks.contractFindMany },
    notification: { create: mocks.notificationCreate },
  },
}));

import { publishDueTrainingContent } from '@/lib/training-scheduler';
import {
  notifyTrainingAudience,
  trainingAudienceUserIds,
  trainingNotification,
} from '@/lib/training-notify';

const coachContent = {
  id: 'content-1',
  title: 'Cone dribbling circuit',
  ownerType: 'COACH',
  coachId: 'coach-1',
  clubId: null,
};

const clubContent = { ...coachContent, ownerType: 'CLUB', coachId: null, clubId: 'club-1' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.contentUpdate.mockResolvedValue({ id: 'content-1' });
  mocks.notificationCreate.mockResolvedValue({ id: 'notification-1' });
  mocks.coachPlayerFindMany.mockResolvedValue([]);
  mocks.contractFindMany.mockResolvedValue([]);
});

describe('trainingAudienceUserIds', () => {
  it('avisa a los jugadores vinculados al coach, sin repetir', async () => {
    mocks.coachPlayerFindMany.mockResolvedValue([
      { player: { userId: 'user-1' } },
      { player: { userId: 'user-1' } },
      { player: { userId: 'user-2' } },
    ]);

    const userIds = await trainingAudienceUserIds(coachContent);

    expect(userIds).toEqual(['user-1', 'user-2']);
    expect(mocks.coachPlayerFindMany.mock.calls[0][0]).toMatchObject({
      where: { coachId: 'coach-1' },
    });
  });

  it('avisa a los jugadores con contrato firmado o activo en el club', async () => {
    mocks.contractFindMany.mockResolvedValue([{ player: { userId: 'user-3' } }]);

    const userIds = await trainingAudienceUserIds(clubContent);

    expect(userIds).toEqual(['user-3']);
    expect(mocks.contractFindMany.mock.calls[0][0]).toMatchObject({
      where: { clubId: 'club-1', status: { in: ['SIGNED', 'ACTIVE'] } },
    });
  });

  it('el contenido general no avisa a nadie', async () => {
    const userIds = await trainingAudienceUserIds({
      ownerType: 'GENERAL',
      coachId: null,
      clubId: null,
    });

    expect(userIds).toEqual([]);
    expect(mocks.coachPlayerFindMany).not.toHaveBeenCalled();
    expect(mocks.contractFindMany).not.toHaveBeenCalled();
  });
});

describe('trainingNotification', () => {
  it('deja claro de quién viene y enlaza al contenido del jugador', () => {
    expect(trainingNotification(coachContent)).toEqual({
      title: 'New training from your coach',
      message: 'Cone dribbling circuit',
      link: '/dashboard/player/training/content-1',
    });
    expect(trainingNotification(clubContent).title).toBe('New training from your club');
  });
});

describe('notifyTrainingAudience', () => {
  it('crea un aviso por jugador y devuelve cuántos fueron', async () => {
    mocks.coachPlayerFindMany.mockResolvedValue([
      { player: { userId: 'user-1' } },
      { player: { userId: 'user-2' } },
    ]);

    const notified = await notifyTrainingAudience(coachContent);

    expect(notified).toBe(2);
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'user-1',
      type: 'training',
      title: 'New training from your coach',
      message: 'Cone dribbling circuit',
      link: '/dashboard/player/training/content-1',
    });
  });

  it('sin audiencia no escribe nada', async () => {
    const notified = await notifyTrainingAudience({ ...coachContent, coachId: 'coach-9' });

    expect(notified).toBe(0);
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});

describe('publishDueTrainingContent', () => {
  it('quita la fecha y avisa de lo que ya llegó a su hora', async () => {
    mocks.contentFindMany.mockResolvedValue([coachContent]);
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-1' } }]);
    const now = new Date('2026-01-01T12:00:00Z');

    const published = await publishDueTrainingContent(now);

    expect(mocks.contentFindMany.mock.calls[0][0].where).toEqual({
      status: 'PUBLISHED',
      publishAt: { not: null, lte: now },
    });
    expect(mocks.contentUpdate.mock.calls[0][0]).toEqual({
      where: { id: 'content-1' },
      data: { publishAt: null },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(published).toEqual([{ id: 'content-1' }]);
  });

  it('no hace nada si no hay nada programado', async () => {
    mocks.contentFindMany.mockResolvedValue([]);

    expect(await publishDueTrainingContent()).toEqual([]);
    expect(mocks.contentUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});
