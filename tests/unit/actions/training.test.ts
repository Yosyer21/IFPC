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
  contentUpdate: vi.fn(),
  quizDeleteMany: vi.fn(),
  quizCreate: vi.fn(),
  storageSave: vi.fn(),
  storageRemove: vi.fn(),
  revalidatePaths: vi.fn(),
  progressFindUnique: vi.fn(),
  progressUpsert: vi.fn(),
  progressDelete: vi.fn(),
  playerFindUnique: vi.fn(),
  coachPlayerFindMany: vi.fn(),
  contractFindMany: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/revalidate', () => ({ revalidatePaths: mocks.revalidatePaths }));
vi.mock('@/lib/storage', () => ({
  resolveStorage: () => ({ save: mocks.storageSave, remove: mocks.storageRemove }),
}));
vi.mock('@ifpc/database', () => ({
  prisma: {
    coach: { findUnique: mocks.coachFindUnique },
    club: { findUnique: mocks.clubFindUnique },
    trainingContent: {
      create: mocks.contentCreate,
      findUnique: mocks.contentFindUnique,
      findFirst: mocks.contentFindFirst,
      delete: mocks.contentDelete,
      update: mocks.contentUpdate,
    },
    quiz: { deleteMany: mocks.quizDeleteMany, create: mocks.quizCreate },
    trainingProgress: {
      findUnique: mocks.progressFindUnique,
      upsert: mocks.progressUpsert,
      delete: mocks.progressDelete,
    },
    player: { findUnique: mocks.playerFindUnique },
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    contract: { findMany: mocks.contractFindMany },
    notification: { create: mocks.notificationCreate },
  },
}));

import {
  createTrainingContentAction,
  deleteTrainingContentAction,
  deleteContentQuizAction,
  publishTrainingContentAction,
  saveContentQuizAction,
  toggleTrainingProgressAction,
  unpublishTrainingContentAction,
  updateTrainingContentAction,
  uploadTrainingCoverAction,
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
  mocks.contentCreate.mockResolvedValue({
    id: 'content-1',
    title: 'Cone dribbling circuit',
    status: 'PUBLISHED',
    publishAt: null,
    ownerType: 'COACH',
    coachId: 'coach-1',
    clubId: null,
  });
  mocks.contentUpdate.mockResolvedValue({ id: 'content-1' });
  mocks.coachPlayerFindMany.mockResolvedValue([]);
  mocks.contractFindMany.mockResolvedValue([]);
  mocks.notificationCreate.mockResolvedValue({ id: 'notification-1' });
  mocks.quizDeleteMany.mockResolvedValue({ count: 0 });
  mocks.quizCreate.mockResolvedValue({ id: 'quiz-1' });
  mocks.storageSave.mockResolvedValue({ url: '/uploads/training/covers/a.png' });
  mocks.storageRemove.mockResolvedValue(undefined);
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

  it('avisa a sus jugadores cuando publica contenido visible', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    await captureRedirect(() => createTrainingContentAction({}, form(baseFields)));

    expect(mocks.contentCreate.mock.calls[0][0].data).toMatchObject({
      status: 'PUBLISHED',
      publishAt: null,
    });
    expect(mocks.notificationCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'user-9',
      type: 'training',
      link: '/dashboard/player/training/content-1',
    });
  });

  it('guarda un borrador sin avisar a nadie', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentCreate.mockResolvedValue({
      id: 'content-1',
      title: 'Cone dribbling circuit',
      status: 'DRAFT',
      publishAt: null,
      ownerType: 'COACH',
      coachId: 'coach-1',
      clubId: null,
    });

    await captureRedirect(() =>
      createTrainingContentAction({}, form({ ...baseFields, visibility: 'DRAFT' }))
    );

    expect(mocks.contentCreate.mock.calls[0][0].data).toMatchObject({
      status: 'DRAFT',
      publishAt: null,
    });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('programa la publicación y espera a avisar', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    const publishAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await captureRedirect(() =>
      createTrainingContentAction({}, form({ ...baseFields, visibility: 'SCHEDULED', publishAt }))
    );

    const data = mocks.contentCreate.mock.calls[0][0].data;
    expect(data.status).toBe('PUBLISHED');
    expect(data.publishAt).toBeInstanceOf(Date);
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('exige una fecha futura para programar', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });

    const state = await createTrainingContentAction(
      {},
      form({ ...baseFields, visibility: 'SCHEDULED', publishAt: 'ayer' })
    );

    expect(state.error).toBeTruthy();
    expect(mocks.contentCreate).not.toHaveBeenCalled();
  });

  it('guarda la ficha del ejercicio y descarta el material que no está en el catálogo', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    const formData = form({
      ...baseFields,
      series: '4',
      reps: '4 min',
      restSeconds: '90',
      space: '30x20 m',
      players: '4v4 + 2 neutrals',
    });
    formData.append('equipment', 'balls');
    formData.append('equipment', 'cones');
    formData.append('equipment', 'spaceship');

    await captureRedirect(() => createTrainingContentAction({}, formData));

    expect(mocks.contentCreate.mock.calls[0][0].data).toMatchObject({
      series: 4,
      reps: '4 min',
      restSeconds: 90,
      space: '30x20 m',
      players: '4v4 + 2 neutrals',
      equipment: ['balls', 'cones'],
    });
  });

  it('rechaza una carga fuera de rango', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });

    const state = await createTrainingContentAction({}, form({ ...baseFields, series: '99' }));

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

/** Contenido propio del coach, para editar, poner quiz y subir medios. */
const ownedContent = {
  id: 'content-1',
  coachId: 'coach-1',
  clubId: null,
  ownerType: 'COACH',
  kind: 'EXERCISE',
  title: 'Old title',
  thumbnailUrl: null,
  videoUrl: null,
  status: 'PUBLISHED',
  publishAt: null,
};

describe('updateTrainingContentAction', () => {
  beforeEach(() => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue(ownedContent);
  });

  it('actualiza el contenido propio y vuelve a su área', async () => {
    const redirectTo = await captureRedirect(() =>
      updateTrainingContentAction(
        {},
        form({ ...baseFields, contentId: 'content-1', title: 'New title' })
      )
    );

    expect(mocks.contentUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: 'content-1' },
      data: { title: 'New title', kind: 'EXERCISE', category: 'technical' },
    });
    // La lista del autor se revalida para que el cambio se vea al volver.
    expect(mocks.revalidatePaths).toHaveBeenCalledWith(
      '/dashboard/coach/training',
      '/dashboard/coach/training/content-1',
      '/dashboard/coach/training/content-1/edit'
    );
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('no deja editar el contenido de otro autor', async () => {
    mocks.contentFindUnique.mockResolvedValue({ ...ownedContent, coachId: 'coach-2' });

    const state = await updateTrainingContentAction(
      {},
      form({ ...baseFields, contentId: 'content-1' })
    );

    expect(state.error).toBe('Content not found.');
    expect(mocks.contentUpdate).not.toHaveBeenCalled();
  });

  it('avisa a sus jugadores cuando el borrador pasa a publicado', async () => {
    mocks.contentFindUnique.mockResolvedValue({ ...ownedContent, status: 'DRAFT' });
    mocks.contentUpdate.mockResolvedValue({
      ...ownedContent,
      status: 'PUBLISHED',
      publishAt: null,
    });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    await captureRedirect(() =>
      updateTrainingContentAction({}, form({ ...baseFields, contentId: 'content-1' }))
    );

    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a avisar al editar algo que ya se veía', async () => {
    mocks.contentUpdate.mockResolvedValue({ ...ownedContent });

    await captureRedirect(() =>
      updateTrainingContentAction({}, form({ ...baseFields, contentId: 'content-1' }))
    );

    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('guarda como borrador sin avisar', async () => {
    mocks.contentUpdate.mockResolvedValue({ ...ownedContent, status: 'DRAFT' });

    await captureRedirect(() =>
      updateTrainingContentAction(
        {},
        form({ ...baseFields, contentId: 'content-1', visibility: 'DRAFT' })
      )
    );

    expect(mocks.contentUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'DRAFT',
      publishAt: null,
    });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});

describe('publishTrainingContentAction', () => {
  beforeEach(() => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue({ ...ownedContent, status: 'DRAFT' });
  });

  it('publica ya el contenido propio y avisa a sus jugadores', async () => {
    mocks.contentUpdate.mockResolvedValue({
      ...ownedContent,
      status: 'PUBLISHED',
      publishAt: null,
    });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    const redirectTo = await captureRedirect(() =>
      publishTrainingContentAction(form({ contentId: 'content-1' }))
    );

    expect(mocks.contentUpdate.mock.calls[0][0]).toEqual({
      where: { id: 'content-1' },
      data: { status: 'PUBLISHED', publishAt: null },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('no toca el contenido de otro autor', async () => {
    mocks.contentFindUnique.mockResolvedValue({ ...ownedContent, coachId: 'coach-2' });

    await captureRedirect(() => publishTrainingContentAction(form({ contentId: 'content-1' })));

    expect(mocks.contentUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});

describe('unpublishTrainingContentAction', () => {
  it('devuelve el contenido a borrador sin avisar a nadie', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue(ownedContent);
    mocks.contentUpdate.mockResolvedValue({ ...ownedContent, status: 'DRAFT' });

    const redirectTo = await captureRedirect(() =>
      unpublishTrainingContentAction(form({ contentId: 'content-1' }))
    );

    expect(mocks.contentUpdate.mock.calls[0][0]).toEqual({
      where: { id: 'content-1' },
      data: { status: 'DRAFT', publishAt: null },
    });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(redirectTo).toBe('/dashboard/coach/training');
  });
});

describe('saveContentQuizAction', () => {
  beforeEach(() => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue(ownedContent);
  });

  it('guarda el quiz con la primera opción como correcta', async () => {
    const redirectTo = await captureRedirect(() =>
      saveContentQuizAction(
        {},
        form({
          contentId: 'content-1',
          quizTitle: 'Cone drill quiz',
          passScore: '80',
          questions: 'Which surface? | Inside | Head',
        })
      )
    );

    expect(mocks.quizDeleteMany).toHaveBeenCalledWith({ where: { contentId: 'content-1' } });
    const created = mocks.quizCreate.mock.calls[0][0].data;
    expect(created).toMatchObject({
      contentId: 'content-1',
      title: 'Cone drill quiz',
      passScore: 80,
    });
    expect(created.questions.create[0].options.create).toEqual([
      { label: 'Inside', isCorrect: true, position: 0 },
      { label: 'Head', isCorrect: false, position: 1 },
    ]);
    expect(redirectTo).toBe('/dashboard/coach/training/content-1/edit');
  });

  it('exige al menos una pregunta válida', async () => {
    const state = await saveContentQuizAction(
      {},
      form({ contentId: 'content-1', questions: 'solo enunciado' })
    );

    expect(state.error).toBeTruthy();
    expect(mocks.quizCreate).not.toHaveBeenCalled();
  });
});

describe('deleteContentQuizAction', () => {
  it('quita el quiz del contenido propio', async () => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue(ownedContent);

    await captureRedirect(() => deleteContentQuizAction(form({ contentId: 'content-1' })));

    expect(mocks.quizDeleteMany).toHaveBeenCalledWith({ where: { contentId: 'content-1' } });
  });
});

describe('uploadTrainingCoverAction', () => {
  beforeEach(() => {
    mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
    mocks.contentFindUnique.mockResolvedValue(ownedContent);
  });

  it('sube la portada, guarda la URL y limpia la anterior', async () => {
    const formData = form({ contentId: 'content-1' });
    formData.set('file', new File([Buffer.from('image')], 'cover.png', { type: 'image/png' }));

    const redirectTo = await captureRedirect(() => uploadTrainingCoverAction({}, formData));

    expect(mocks.storageSave).toHaveBeenCalledTimes(1);
    expect(mocks.storageSave.mock.calls[0][0].key.startsWith('training/covers/')).toBe(true);
    expect(mocks.contentUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: 'content-1' },
      data: { thumbnailUrl: '/uploads/training/covers/a.png' },
    });
    expect(mocks.storageRemove).toHaveBeenCalledWith(null);
    expect(redirectTo).toBe('/dashboard/coach/training/content-1/edit');
  });

  it('rechaza los formatos que no son imagen', async () => {
    const formData = form({ contentId: 'content-1' });
    formData.set('file', new File([Buffer.from('pdf')], 'plan.pdf', { type: 'application/pdf' }));

    const state = await uploadTrainingCoverAction({}, formData);

    expect(state.error).toBeTruthy();
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });
});
