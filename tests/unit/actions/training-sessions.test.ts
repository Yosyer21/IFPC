import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  coachFindUnique: vi.fn(),
  clubFindUnique: vi.fn(),
  sessionCreate: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionFindUnique: vi.fn(),
  sessionDelete: vi.fn(),
  itemCreate: vi.fn(),
  itemFindUnique: vi.fn(),
  itemFindFirst: vi.fn(),
  itemFindMany: vi.fn(),
  itemDelete: vi.fn(),
  itemUpdate: vi.fn(),
  contentFindUnique: vi.fn(),
  transaction: vi.fn(),
  notificationCreate: vi.fn(),
  coachPlayerFindMany: vi.fn(),
  contractFindMany: vi.fn(),
  revalidatePaths: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/revalidate', () => ({ revalidatePaths: mocks.revalidatePaths }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    coach: { findUnique: mocks.coachFindUnique },
    club: { findUnique: mocks.clubFindUnique },
    trainingSession: {
      create: mocks.sessionCreate,
      update: mocks.sessionUpdate,
      findUnique: mocks.sessionFindUnique,
      delete: mocks.sessionDelete,
    },
    trainingSessionItem: {
      create: mocks.itemCreate,
      findUnique: mocks.itemFindUnique,
      findFirst: mocks.itemFindFirst,
      findMany: mocks.itemFindMany,
      delete: mocks.itemDelete,
      update: mocks.itemUpdate,
    },
    trainingContent: { findUnique: mocks.contentFindUnique },
    trainingProgress: { findMany: vi.fn() },
    notification: { create: mocks.notificationCreate },
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    contract: { findMany: mocks.contractFindMany },
    $transaction: mocks.transaction,
  },
}));

import {
  addTrainingSessionItemAction,
  createTrainingSessionAction,
  deleteTrainingSessionAction,
  moveTrainingSessionItemAction,
  publishTrainingSessionAction,
  removeTrainingSessionItemAction,
  unpublishTrainingSessionAction,
  updateTrainingSessionAction,
} from '@/app/actions/training-sessions';

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const baseFields = {
  title: 'Session 3: possession and the third man',
  description: 'Rondo and third man',
  weekday: '2',
};

/** Sesión propia del coach, tal como la devuelve Prisma. */
const ownedSession = {
  id: 'session-1',
  coachId: 'coach-1',
  clubId: null,
  title: 'Old session',
  description: null,
  weekday: 2,
  ownerType: 'COACH',
  status: 'PUBLISHED',
  publishAt: null,
};

const ownedItem = { id: 'item-a', position: 0, sessionId: 'session-1' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.coachFindUnique.mockResolvedValue({ id: 'coach-1' });
  mocks.clubFindUnique.mockResolvedValue(null);
  mocks.sessionCreate.mockResolvedValue({ id: 'session-1' });
  mocks.sessionFindUnique.mockResolvedValue(ownedSession);
  mocks.sessionUpdate.mockResolvedValue({ ...ownedSession, items: [] });
  mocks.sessionDelete.mockResolvedValue(ownedSession);
  mocks.itemCreate.mockResolvedValue({ id: 'item-new' });
  mocks.itemFindUnique.mockResolvedValue(ownedItem);
  mocks.itemFindFirst.mockResolvedValue(null);
  mocks.itemFindMany.mockResolvedValue([ownedItem]);
  mocks.itemDelete.mockResolvedValue(ownedItem);
  mocks.itemUpdate.mockResolvedValue(ownedItem);
  mocks.contentFindUnique.mockResolvedValue({ coachId: 'coach-1', clubId: null });
  mocks.transaction.mockResolvedValue([]);
  mocks.coachPlayerFindMany.mockResolvedValue([]);
  mocks.contractFindMany.mockResolvedValue([]);
  mocks.notificationCreate.mockResolvedValue({ id: 'notification-1' });
});

describe('createTrainingSessionAction', () => {
  it('crea la sesión del coach y lleva directo a montarla', async () => {
    const redirectTo = await captureRedirect(() =>
      createTrainingSessionAction({}, form(baseFields))
    );

    expect(mocks.sessionCreate.mock.calls[0][0].data).toMatchObject({
      title: 'Session 3: possession and the third man',
      description: 'Rondo and third man',
      weekday: 2,
      ownerType: 'COACH',
      coachId: 'coach-1',
      clubId: null,
      status: 'PUBLISHED',
      publishAt: null,
    });
    expect(redirectTo).toBe('/dashboard/coach/training/sessions/session-1/edit');
  });

  it('no avisa de una sesión recién creada (todavía está vacía)', async () => {
    await captureRedirect(() => createTrainingSessionAction({}, form(baseFields)));

    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('guarda un borrador y programa con fecha', async () => {
    await captureRedirect(() =>
      createTrainingSessionAction({}, form({ ...baseFields, visibility: 'DRAFT' }))
    );
    expect(mocks.sessionCreate.mock.calls[0][0].data).toMatchObject({
      status: 'DRAFT',
      publishAt: null,
    });

    const publishAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await captureRedirect(() =>
      createTrainingSessionAction({}, form({ ...baseFields, visibility: 'SCHEDULED', publishAt }))
    );
    expect(mocks.sessionCreate.mock.calls[1][0].data.publishAt).toBeInstanceOf(Date);
  });

  it('un día fuera del catálogo se guarda sin día', async () => {
    await captureRedirect(() =>
      createTrainingSessionAction({}, form({ ...baseFields, weekday: '9' }))
    );

    expect(mocks.sessionCreate.mock.calls[0][0].data.weekday).toBeNull();
  });

  it('solo publican coaches y clubes', async () => {
    mocks.coachFindUnique.mockResolvedValue(null);

    const state = await createTrainingSessionAction({}, form(baseFields));

    expect(state.error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });

  it('valida los campos antes de guardar', async () => {
    const state = await createTrainingSessionAction({}, form({ ...baseFields, title: 'X' }));

    expect(state.error).toBeTruthy();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });
});

describe('updateTrainingSessionAction', () => {
  it('actualiza la sesión propia y vuelve al Football Center', async () => {
    const redirectTo = await captureRedirect(() =>
      updateTrainingSessionAction({}, form({ ...baseFields, sessionId: 'session-1' }))
    );

    expect(mocks.sessionUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: 'session-1' },
      data: { title: baseFields.title, weekday: 2, status: 'PUBLISHED', publishAt: null },
    });
    expect(mocks.revalidatePaths).toHaveBeenCalledWith(
      '/dashboard/coach/training',
      '/dashboard/coach/training/sessions/session-1/edit'
    );
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('avisa al publicar una sesión que ya tiene ejercicios', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, status: 'DRAFT' });
    mocks.sessionUpdate.mockResolvedValue({
      ...ownedSession,
      status: 'PUBLISHED',
      items: [{ id: 'i1' }],
    });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    await captureRedirect(() =>
      updateTrainingSessionAction({}, form({ ...baseFields, sessionId: 'session-1' }))
    );

    expect(mocks.notificationCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'user-9',
      type: 'training',
      title: 'New training session from your coach',
      link: '/dashboard/player/training/sessions/session-1',
    });
  });

  it('no avisa si la sesión sigue vacía', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, status: 'DRAFT' });
    mocks.sessionUpdate.mockResolvedValue({ ...ownedSession, items: [] });

    await captureRedirect(() =>
      updateTrainingSessionAction({}, form({ ...baseFields, sessionId: 'session-1' }))
    );

    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('no deja editar la sesión de otro autor', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, coachId: 'coach-2' });

    const state = await updateTrainingSessionAction(
      {},
      form({ ...baseFields, sessionId: 'session-1' })
    );

    expect(state.error).toBe('Session not found.');
    expect(mocks.sessionUpdate).not.toHaveBeenCalled();
  });
});

describe('deleteTrainingSessionAction', () => {
  it('borra la sesión propia', async () => {
    const redirectTo = await captureRedirect(() =>
      deleteTrainingSessionAction(form({ sessionId: 'session-1' }))
    );

    expect(mocks.sessionDelete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('no toca la sesión de otro autor', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, clubId: 'club-9', coachId: null });

    await captureRedirect(() => deleteTrainingSessionAction(form({ sessionId: 'session-1' })));

    expect(mocks.sessionDelete).not.toHaveBeenCalled();
  });
});

describe('addTrainingSessionItemAction', () => {
  it('añade un ejercicio propio al final de la sesión', async () => {
    mocks.itemFindFirst.mockResolvedValue({ position: 2 });

    const redirectTo = await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );

    expect(mocks.itemCreate.mock.calls[0][0].data).toEqual({
      sessionId: 'session-1',
      contentId: 'content-9',
      position: 3,
    });
    expect(redirectTo).toBe('/dashboard/coach/training/sessions/session-1/edit');
  });

  it('avisa al estrenar el primer ejercicio de una sesión publicada', async () => {
    mocks.itemFindFirst.mockResolvedValue(null);
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );

    expect(mocks.notificationCreate.mock.calls[0][0].data).toMatchObject({
      userId: 'user-9',
      title: 'New training session from your coach',
      link: '/dashboard/player/training/sessions/session-1',
    });
  });

  it('no avisa al añadir el segundo ejercicio ni en un borrador', async () => {
    mocks.itemFindFirst.mockResolvedValue({ position: 0 });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );
    expect(mocks.notificationCreate).not.toHaveBeenCalled();

    mocks.itemFindFirst.mockResolvedValue(null);
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, status: 'DRAFT' });

    await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('no añade contenido de otro autor', async () => {
    mocks.contentFindUnique.mockResolvedValue({ coachId: null, clubId: 'club-9' });

    const redirectTo = await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );

    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(redirectTo).toBe('/dashboard/coach/training/sessions/session-1/edit');
  });

  it('si el ejercicio ya estaba dentro, no rompe nada', async () => {
    mocks.itemCreate.mockRejectedValue(new Error('unique constraint'));

    const redirectTo = await captureRedirect(() =>
      addTrainingSessionItemAction(form({ sessionId: 'session-1', contentId: 'content-9' }))
    );

    expect(redirectTo).toBe('/dashboard/coach/training/sessions/session-1/edit');
    expect(mocks.revalidatePaths).toHaveBeenCalled();
  });
});

describe('removeTrainingSessionItemAction', () => {
  it('quita el ejercicio de la sesión propia', async () => {
    const redirectTo = await captureRedirect(() =>
      removeTrainingSessionItemAction(form({ itemId: 'item-a' }))
    );

    expect(mocks.itemDelete).toHaveBeenCalledWith({ where: { id: 'item-a' } });
    expect(redirectTo).toBe('/dashboard/coach/training/sessions/session-1/edit');
  });

  it('no toca un item de una sesión ajena', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, coachId: 'coach-2' });

    await captureRedirect(() => removeTrainingSessionItemAction(form({ itemId: 'item-a' })));

    expect(mocks.itemDelete).not.toHaveBeenCalled();
  });
});

describe('moveTrainingSessionItemAction', () => {
  it('baja el ejercicio intercambiando posiciones con el siguiente', async () => {
    mocks.itemFindMany.mockResolvedValue([
      { id: 'item-a', position: 0 },
      { id: 'item-b', position: 1 },
    ]);

    await captureRedirect(() =>
      moveTrainingSessionItemAction(form({ itemId: 'item-a', direction: 'down' }))
    );

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.itemUpdate.mock.calls[0][0]).toEqual({
      where: { id: 'item-a' },
      data: { position: 1 },
    });
    expect(mocks.itemUpdate.mock.calls[1][0]).toEqual({
      where: { id: 'item-b' },
      data: { position: 0 },
    });
  });

  it('no hace nada si ya está en el extremo', async () => {
    await captureRedirect(() =>
      moveTrainingSessionItemAction(form({ itemId: 'item-a', direction: 'up' }))
    );

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe('publicar y despublicar sesiones', () => {
  it('publica ya la sesión y avisa si tiene ejercicios', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ ...ownedSession, status: 'DRAFT' });
    mocks.sessionUpdate.mockResolvedValue({
      ...ownedSession,
      status: 'PUBLISHED',
      items: [{ id: 'i1' }],
    });
    mocks.coachPlayerFindMany.mockResolvedValue([{ player: { userId: 'user-9' } }]);

    const redirectTo = await captureRedirect(() =>
      publishTrainingSessionAction(form({ sessionId: 'session-1' }))
    );

    expect(mocks.sessionUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: 'session-1' },
      data: { status: 'PUBLISHED', publishAt: null },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(redirectTo).toBe('/dashboard/coach/training');
  });

  it('devuelve la sesión a borrador sin avisar', async () => {
    mocks.sessionUpdate.mockResolvedValue({ ...ownedSession, status: 'DRAFT' });

    await captureRedirect(() => unpublishTrainingSessionAction(form({ sessionId: 'session-1' })));

    expect(mocks.sessionUpdate.mock.calls[0][0].data).toEqual({
      status: 'DRAFT',
      publishAt: null,
    });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});
