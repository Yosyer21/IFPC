import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  playerFindUnique: vi.fn(),
  playerUpdate: vi.fn(),
  entryFindUnique: vi.fn(),
  entryFindFirst: vi.fn(),
  entryCreate: vi.fn(),
  entryUpdate: vi.fn(),
  entryUpdateMany: vi.fn(),
  entryDeleteMany: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    player: { findUnique: mocks.playerFindUnique, update: mocks.playerUpdate },
    careerEntry: {
      findUnique: mocks.entryFindUnique,
      findFirst: mocks.entryFindFirst,
      create: mocks.entryCreate,
      update: mocks.entryUpdate,
      updateMany: mocks.entryUpdateMany,
      deleteMany: mocks.entryDeleteMany,
    },
  },
}));
vi.mock('@/lib/notifications/notify', () => ({ notifyUser: vi.fn() }));

import { removeCareerEntryAction, saveCareerEntryAction } from '@/app/actions/player';

const CAREER_URL = '/dashboard/player/career';

function careerForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const validEntry = {
  clubName: 'Future Baller Academy',
  category: 'Sub-17',
  season: '2025/26',
  appearances: '18',
  goals: '12',
  assists: '7',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.playerFindUnique.mockResolvedValue({ id: 'player-1' });
  mocks.playerUpdate.mockResolvedValue({});
  mocks.entryCreate.mockResolvedValue({});
  mocks.entryUpdate.mockResolvedValue({});
  mocks.entryUpdateMany.mockResolvedValue({ count: 0 });
  mocks.entryDeleteMany.mockResolvedValue({ count: 1 });
});

describe('saveCareerEntryAction', () => {
  it('rechaza una temporada con formato inválido', async () => {
    const result = await saveCareerEntryAction({}, careerForm({ ...validEntry, season: 'verano' }));
    expect(result).toEqual({
      error: 'Revisa los datos de la trayectoria (temporada tipo 2024/25).',
    });
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });

  it('rechaza un club vacío', async () => {
    const result = await saveCareerEntryAction({}, careerForm({ ...validEntry, clubName: '   ' }));
    expect(result).toEqual({
      error: 'Revisa los datos de la trayectoria (temporada tipo 2024/25).',
    });
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });

  it('crea la entrada en el perfil del jugador autenticado', async () => {
    const target = await captureRedirect(() => saveCareerEntryAction({}, careerForm(validEntry)));

    expect(target).toBe(CAREER_URL);
    expect(mocks.entryCreate).toHaveBeenCalledWith({
      data: {
        playerId: 'player-1',
        clubName: 'Future Baller Academy',
        category: 'Sub-17',
        season: '2025/26',
        appearances: 18,
        goals: 12,
        assists: 7,
        isCurrent: false,
        notes: null,
      },
    });
    expect(mocks.playerUpdate).not.toHaveBeenCalled();
  });

  it('al marcar equipo actual desmarca el resto y sincroniza Player.clubName', async () => {
    await captureRedirect(() =>
      saveCareerEntryAction({}, careerForm({ ...validEntry, isCurrent: 'on' }))
    );

    expect(mocks.entryUpdateMany).toHaveBeenCalledWith({
      where: { playerId: 'player-1', isCurrent: true },
      data: { isCurrent: false },
    });
    expect(mocks.playerUpdate).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { clubName: 'Future Baller Academy' },
    });
  });

  it('actualiza una entrada existente del propio jugador', async () => {
    mocks.entryFindUnique.mockResolvedValue({ id: 'entry-1', playerId: 'player-1' });

    const target = await captureRedirect(() =>
      saveCareerEntryAction({}, careerForm({ ...validEntry, entryId: 'entry-1' }))
    );

    expect(target).toBe(CAREER_URL);
    expect(mocks.entryUpdate).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: expect.objectContaining({ clubName: 'Future Baller Academy' }),
    });
    expect(mocks.entryCreate).not.toHaveBeenCalled();
  });

  it('no deja editar una entrada de otro jugador', async () => {
    mocks.entryFindUnique.mockResolvedValue({ id: 'entry-9', playerId: 'other-player' });

    const result = await saveCareerEntryAction(
      {},
      careerForm({ ...validEntry, entryId: 'entry-9' })
    );

    expect(result).toEqual({ error: 'Entrada no encontrada.' });
    expect(mocks.entryUpdate).not.toHaveBeenCalled();
  });

  it('falla con sesión inválida', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await saveCareerEntryAction({}, careerForm(validEntry));
    expect(result).toEqual({ error: 'Invalid session.' });
  });
});

describe('removeCareerEntryAction', () => {
  it('elimina la entrada del jugador autenticado', async () => {
    mocks.entryFindFirst.mockResolvedValue({ id: 'entry-1', isCurrent: false });

    const target = await captureRedirect(() =>
      removeCareerEntryAction(careerForm({ entryId: 'entry-1' }))
    );

    expect(target).toBe(CAREER_URL);
    expect(mocks.entryFindFirst).toHaveBeenCalledWith({
      where: { id: 'entry-1', playerId: 'player-1' },
    });
    expect(mocks.entryDeleteMany).toHaveBeenCalledWith({
      where: { id: 'entry-1', playerId: 'player-1' },
    });
    expect(mocks.playerUpdate).not.toHaveBeenCalled();
  });

  it('limpia Player.clubName al borrar el equipo actual', async () => {
    mocks.entryFindFirst.mockResolvedValue({ id: 'entry-1', isCurrent: true });

    await captureRedirect(() => removeCareerEntryAction(careerForm({ entryId: 'entry-1' })));

    expect(mocks.playerUpdate).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { clubName: null },
    });
  });

  it('no borra nada si la entrada no es del jugador', async () => {
    mocks.entryFindFirst.mockResolvedValue(null);

    const target = await captureRedirect(() =>
      removeCareerEntryAction(careerForm({ entryId: 'entry-9' }))
    );

    expect(target).toBeNull();
    expect(mocks.entryDeleteMany).not.toHaveBeenCalled();
  });
});
