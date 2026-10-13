import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  coachFindUnique: vi.fn(),
  clubFindUnique: vi.fn(),
  contentCreate: vi.fn(),
  contentFindUnique: vi.fn(),
  contentFindFirst: vi.fn(),
  contentDelete: vi.fn(),
  progressFindUnique: vi.fn(),
  progressUpsert: vi.fn(),
  progressDelete: vi.fn(),
  playerFindUnique: vi.fn(),
  coachPlayerFindMany: vi.fn(),
  contractFindMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    coach: { findUnique: mocks.coachFindUnique },
    club: { findUnique: mocks.clubFindUnique },
    trainingContent: {
      create: mocks.contentCreate,
      findUnique: mocks.contentFindUnique,
      findFirst: mocks.contentFindFirst,
      delete: mocks.contentDelete,
    },
    trainingProgress: {
      findUnique: mocks.progressFindUnique,
      upsert: mocks.progressUpsert,
      delete: mocks.progressDelete,
    },
    player: { findUnique: mocks.playerFindUnique },
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    contract: { findMany: mocks.contractFindMany },
  },
}));

import {
  createTrainingContentAction,
  deleteTrainingContentAction,
  toggleTrainingProgressAction,
} from '@/app/actions/training';

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const baseFields = {
  kind: 'EXERCISE',
  category: 'technical',
  title: 'Cone dribbling circuit',
  description: 'Close control through cones',
  durationMinutes: '15',
  difficulty: '2',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.coachFindUnique.mockResolvedValue(null);
  mocks.clubFindUnique.mockResolvedValue(null);
  mocks.contentCreate.mockResolvedValue({ id: 'content-1' });
});

describe('createTrainingContentAction', () => {
  it('un coach publica contenido suyo', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });

    const redirectTo = await captureRedirect(() =>
      createTrainingContentAction({}, form(baseFields))
    );

    expect(mocks.contentCreate.mock.calls[0][0].data).toMatchObject({
      title: 'Cone dribbling circuit',
      kind: 'EXERCISE',
      ownerType: 'COACH',
      coachId: 'coach-1',
      clubId: null,
      durationMinutes: 15,
      difficulty: 2,
    });
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('un club publica contenido para sus jugadores', async () => {
    mocks.clubFindUnique.mockResolvedValue({ id: 'club-1' });

    const redirectTo = await captureRedirect(() =>
      createTrainingContentAction({}, form({ ...baseFields, kind: 'COURSE' }))
    );

    expect(mocks.contentCreate.mock.calls[0][0].data).toMatchObject({
      kind: 'COURSE',
      ownerType: 'CLUB',
      clubId: 'club-1',
      coachId: null,
    });
    expect(redirectTo).toBe('/dashboard/club/training');
  });

  it('solo publican coaches y clubes', async () => {
    const state = await createTrainingContentAction({}, form(baseFields));

    expect(state.error).toBeTruthy();
    expect(mocks.contentCreate).not.toHaveBeenCalled();
  });

  it('valida los campos antes de guardar', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });

    const state = await createTrainingContentAction(
      {},
      form({ ...baseFields, title: 'X', category: 'tactics' })
    );

    expect(state.error).toBeTruthy();
    expect(mocks.contentCreate).not.toHaveBeenCalled();
  });
});

describe('deleteTrainingContentAction', () => {
  it('borra el contenido propio', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue({ coachId: 'coach-1', clubId: null });

    const redirectTo = await captureRedirect(() =>
      deleteTrainingContentAction(form({ contentId: 'content-1' }))
    );

    expect(mocks.contentDelete).toHaveBeenCalledTimes(1);
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('no toca el contenido de otro autor', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue({ coachId: 'coach-2', clubId: null });

    await captureRedirect(() => deleteTrainingContentAction(form({ contentId: 'content-1' })));

    expect(mocks.contentDelete).not.toHaveBeenCalled();
  });
});

describe('toggleTrainingProgressAction', () => {
  beforeEach(() => {
    mocks.playerFindUnique.mockResolvedValue({ id: 'player-1' });
    mocks.coachPlayerFindMany.mockResolvedValue([{ coachId: 'coach-1' }]);
    mocks.contractFindMany.mockResolvedValue([{ clubId: 'club-1' }]);
    mocks.contentFindFirst.mockResolvedValue({ id: 'content-1' });
  });

  it('marca el contenido como completado', async () => {
    mocks.progressFindUnique.mockResolvedValue(null);

    await captureRedirect(() =>
      toggleTrainingProgressAction(
        form({ contentId: 'content-1', redirectTo: '/dashboard/player/training/content-1' })
      )
    );

    expect(mocks.progressUpsert.mock.calls[0][0]).toMatchObject({
      where: { playerId_contentId: { playerId: 'player-1', contentId: 'content-1' } },
      create: { playerId: 'player-1', contentId: 'content-1' },
    });
    expect(mocks.progressUpsert.mock.calls[0][0].create.completedAt).toBeInstanceOf(Date);
  });

  it('lo desmarca cuando ya estaba completado', async () => {
    mocks.progressFindUnique.mockResolvedValue({ completedAt: new Date() });

    await captureRedirect(() => toggleTrainingProgressAction(form({ contentId: 'content-1' })));

    expect(mocks.progressDelete).toHaveBeenCalledTimes(1);
    expect(mocks.progressUpsert).not.toHaveBeenCalled();
  });

  it('ignora el contenido que no le llega', async () => {
    mocks.contentFindFirst.mockResolvedValue(null);

    await captureRedirect(() => toggleTrainingProgressAction(form({ contentId: 'content-9' })));

    expect(mocks.progressUpsert).not.toHaveBeenCalled();
    expect(mocks.progressDelete).not.toHaveBeenCalled();
  });
});
