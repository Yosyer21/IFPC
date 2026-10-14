import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  coachPlayerFindMany: vi.fn(),
  contractFindMany: vi.fn(),
  progressFindMany: vi.fn(),
  playerFindMany: vi.fn(),
}));

vi.mock('@ifpc/database', () => ({
  prisma: {
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    contract: { findMany: mocks.contractFindMany },
    trainingProgress: { findMany: mocks.progressFindMany },
    player: { findMany: mocks.playerFindMany },
  },
}));

import {
  authorPlayers,
  contentRecipients,
  pendingRecipients,
  playerDisplayName,
  playerUserIds,
  resolveTrainingAssignment,
  sessionRecipients,
  targetCreateInput,
  targetUpdateInput,
} from '@/lib/training-assignments';

function form(fields: Record<string, string | string[]>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) for (const entry of value) formData.append(key, entry);
    else formData.set(key, value);
  }
  return formData;
}

const roster = [
  { player: { id: 'player-2', firstName: 'Second', lastName: 'Player' } },
  { player: { id: 'player-1', firstName: 'Demo', lastName: 'Player' } },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.coachPlayerFindMany.mockResolvedValue(roster);
  mocks.contractFindMany.mockResolvedValue(roster);
  mocks.progressFindMany.mockResolvedValue([]);
  mocks.playerFindMany.mockResolvedValue([{ userId: 'user-1' }]);
});

describe('authorPlayers', () => {
  it('lista los jugadores del coach ordenados por nombre', async () => {
    const players = await authorPlayers({ coachId: 'coach-1', clubId: null });

    expect(players).toEqual([
      { playerId: 'player-1', name: 'Demo Player' },
      { playerId: 'player-2', name: 'Second Player' },
    ]);
  });

  it('en un club solo cuenta los contratos firmados o activos', async () => {
    await authorPlayers({ coachId: null, clubId: 'club-1' });

    expect(mocks.contractFindMany.mock.calls[0][0].where).toEqual({
      clubId: 'club-1',
      status: { in: ['SIGNED', 'ACTIVE'] },
    });
  });

  it('sin coach ni club no hay audiencia', async () => {
    expect(await authorPlayers({ coachId: null, clubId: null })).toEqual([]);
  });
});

describe('contentRecipients', () => {
  const content = {
    id: 'content-1',
    coachId: 'coach-1',
    clubId: null,
    scope: 'AUDIENCE',
    targetPlayerIds: [],
  };

  it('con toda la audiencia lista a todos', async () => {
    const recipients = await contentRecipients(content);

    expect(recipients).toHaveLength(2);
    expect(recipients[0]).toMatchObject({
      playerId: 'player-1',
      targeted: false,
      completedAt: null,
    });
  });

  it('dirigido a algunos solo lista a los elegidos', async () => {
    const recipients = await contentRecipients({
      ...content,
      scope: 'SELECTED',
      targetPlayerIds: ['player-2'],
    });

    expect(recipients).toEqual([
      {
        playerId: 'player-2',
        name: 'Second Player',
        targeted: true,
        completedAt: null,
        completedItems: null,
        totalItems: null,
      },
    ]);
  });
});

describe('sessionRecipients', () => {
  it('cuenta los ejercicios hechos de los que tiene la sesión', async () => {
    mocks.progressFindMany.mockResolvedValue([
      { playerId: 'player-1', contentId: 'content-1' },
      { playerId: 'player-1', contentId: 'content-2' },
    ]);

    const recipients = await sessionRecipients({
      id: 'session-1',
      coachId: 'coach-1',
      clubId: null,
      scope: 'AUDIENCE',
      targetPlayerIds: [],
      items: [{ contentId: 'content-1' }, { contentId: 'content-2' }],
    });

    expect(recipients.find((row) => row.playerId === 'player-1')).toMatchObject({
      completedItems: 2,
      totalItems: 2,
    });
    expect(recipients.find((row) => row.playerId === 'player-2')).toMatchObject({
      completedItems: 0,
      totalItems: 2,
    });
  });
});

describe('pendingRecipients', () => {
  const base = { name: 'Player', targeted: false, completedItems: null, totalItems: null };

  it('deja fuera a quien ya lo ha hecho', () => {
    expect(
      pendingRecipients([
        { ...base, playerId: 'p1', completedAt: new Date() },
        { ...base, playerId: 'p2', completedAt: null },
      ]).map((row) => row.playerId)
    ).toEqual(['p2']);
  });

  it('en una sesión cuenta los que van por detrás', () => {
    expect(
      pendingRecipients([
        { ...base, playerId: 'p1', completedItems: 2, totalItems: 2 },
        { ...base, playerId: 'p2', completedItems: 1, totalItems: 2 },
        { ...base, playerId: 'p3', completedItems: 0, totalItems: 0 },
      ]).map((row) => row.playerId)
    ).toEqual(['p2']);
  });
});

describe('resolveTrainingAssignment', () => {
  const owner = { coachId: 'coach-1', clubId: null };

  it('sin destinatarios explícitos va a toda la audiencia', async () => {
    expect(await resolveTrainingAssignment(form({}), owner)).toEqual({
      scope: 'AUDIENCE',
      playerIds: [],
    });
    expect(await resolveTrainingAssignment(form({ scope: 'OTRO' }), owner)).toEqual({
      scope: 'AUDIENCE',
      playerIds: [],
    });
  });

  it('con jugadores elegidos solo acepta los suyos', async () => {
    const assignment = await resolveTrainingAssignment(
      form({ scope: 'SELECTED', playerIds: ['player-1', 'player-ajeno'] }),
      owner
    );

    expect(assignment).toEqual({ scope: 'SELECTED', playerIds: ['player-1'] });
  });

  it('no deja publicar «solo a algunos» sin marcar a nadie', async () => {
    const assignment = await resolveTrainingAssignment(form({ scope: 'SELECTED' }), owner);

    expect(assignment).toHaveProperty('error');
  });
});

describe('escritura de destinatarios', () => {
  it('al crear se añaden; al editar se reemplazan', () => {
    expect(targetCreateInput({ scope: 'SELECTED', playerIds: ['p1'] })).toEqual({
      scope: 'SELECTED',
      targets: { create: [{ playerId: 'p1' }] },
    });
    expect(targetUpdateInput({ scope: 'AUDIENCE', playerIds: [] })).toEqual({
      scope: 'AUDIENCE',
      targets: { deleteMany: {}, create: [] },
    });
  });
});

describe('utilidades de jugador', () => {
  it('compone el nombre y saca los usuarios sin repetir', async () => {
    expect(playerDisplayName({ firstName: 'Demo', lastName: 'Player' })).toBe('Demo Player');

    mocks.playerFindMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-1' }]);

    expect(await playerUserIds(['player-1', 'player-2'])).toEqual(['user-1']);
    expect(await playerUserIds([])).toEqual([]);
  });
});
