import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clubFindUnique: vi.fn(),
  clubFindMany: vi.fn(),
  clubStaffFindMany: vi.fn(),
  contractFindMany: vi.fn(),
  coachFindUnique: vi.fn(),
  coachFindMany: vi.fn(),
  coachPlayerFindMany: vi.fn(),
  playerFindUnique: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    club: { findUnique: mocks.clubFindUnique, findMany: mocks.clubFindMany },
    clubStaff: { findMany: mocks.clubStaffFindMany },
    contract: { findMany: mocks.contractFindMany },
    coach: { findUnique: mocks.coachFindUnique, findMany: mocks.coachFindMany },
    coachPlayer: { findMany: mocks.coachPlayerFindMany },
    player: { findUnique: mocks.playerFindUnique },
  },
}));

import { canViewLiveSession, clubCoachIds, coachClubIds, userClubIds } from '@/lib/live-sessions';

/**
 * Mundo de prueba: un club con un coach en su staff (que además entrena a un
 * jugador con contrato en el club) y gente de fuera.
 */
const CLUB = { id: 'club-1', userId: 'user-club' };
const COACH = { id: 'coach-1', userId: 'user-coach' };
const PLAYER = { id: 'player-1', userId: 'user-player' };

/** Todas las formas que Prisma devuelve en este módulo, en un solo objeto. */
const clubRow = { id: CLUB.id, userId: CLUB.userId };
const playerRow = { id: PLAYER.id, userId: PLAYER.userId };

function world() {
  mocks.clubFindUnique.mockImplementation((args: { where: { id?: string; userId?: string } }) =>
    Promise.resolve(args.where.userId === CLUB.userId || args.where.id === CLUB.id ? clubRow : null)
  );
  mocks.clubFindMany.mockResolvedValue([]);
  mocks.clubStaffFindMany.mockResolvedValue([
    { clubId: CLUB.id, userId: COACH.userId },
    { clubId: CLUB.id, userId: CLUB.userId },
  ]);
  mocks.contractFindMany.mockResolvedValue([
    { clubId: CLUB.id, playerId: PLAYER.id, player: { userId: PLAYER.userId } },
  ]);
  // Solo el coach de demo es coach: el resto de usuarios no tiene perfil de coach.
  mocks.coachFindUnique.mockImplementation(
    (args: { where: { id?: string; userId?: string } }) =>
      Promise.resolve(
        args.where.id === COACH.id || args.where.userId === COACH.userId
          ? { id: COACH.id, userId: COACH.userId }
          : null
      )
  );
  mocks.coachFindMany.mockImplementation((args: { where: { OR?: unknown[] } }) =>
    Promise.resolve(args.where.OR && args.where.OR.length > 0 ? [{ id: COACH.id }] : [])
  );
  mocks.coachPlayerFindMany.mockResolvedValue([{ player: { contracts: [{ clubId: CLUB.id }] } }]);
  mocks.playerFindUnique.mockImplementation((args: { where: { userId?: string } }) =>
    Promise.resolve(args.where.userId === PLAYER.userId ? playerRow : null)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  world();
});

describe('coaches y clubes', () => {
  it('el club incluye a los coaches de su staff y a los de sus jugadores', async () => {
    await expect(clubCoachIds(CLUB.id)).resolves.toEqual([COACH.id]);
  });

  it('un club sin coaches ni jugadores no devuelve a nadie', async () => {
    mocks.clubFindMany.mockResolvedValue([]);
    mocks.clubStaffFindMany.mockResolvedValue([]);
    mocks.contractFindMany.mockResolvedValue([]);
    mocks.coachFindMany.mockImplementation(() => Promise.resolve([]));

    await expect(clubCoachIds('club-vacio')).resolves.toEqual([]);
  });

  it('el coach sabe con qué clubes trabaja', async () => {
    await expect(coachClubIds(COACH.id)).resolves.toEqual([CLUB.id]);
  });

  it('el jugador pertenece al club de su contrato', async () => {
    await expect(userClubIds(PLAYER.userId)).resolves.toEqual([CLUB.id]);
  });
});

describe('quién puede ver una sesión', () => {
  /** Sesión de club organizada por el coach: `clubId` nulo, visibilidad CLUB. */
  const coachClubSession = {
    playerId: null,
    coachId: COACH.id,
    clubId: null,
    visibility: 'CLUB',
  };

  it('la ve el club aunque la organice su coach', async () => {
    await expect(
      canViewLiveSession({ id: CLUB.userId, role: 'CLUB' }, coachClubSession)
    ).resolves.toBe(true);
  });

  it('y la ven sus jugadores con contrato (no se queda solo para el coach)', async () => {
    await expect(
      canViewLiveSession({ id: PLAYER.userId, role: 'PLAYER' }, coachClubSession)
    ).resolves.toBe(true);
  });

  it('el propio coach la ve', async () => {
    await expect(
      canViewLiveSession({ id: COACH.userId, role: 'COACH' }, coachClubSession)
    ).resolves.toBe(true);
  });

  it('quien no está en el club no la ve', async () => {
    await expect(
      canViewLiveSession({ id: 'user-outsider', role: 'PLAYER' }, coachClubSession)
    ).resolves.toBe(false);
  });

  it('una sesión 1:1 sigue siendo privada', async () => {
    const oneToOne = {
      playerId: PLAYER.id,
      coachId: COACH.id,
      clubId: null,
      visibility: 'CLUB',
    };

    await expect(canViewLiveSession({ id: PLAYER.userId, role: 'PLAYER' }, oneToOne)).resolves.toBe(
      true
    );
    await expect(canViewLiveSession({ id: CLUB.userId, role: 'CLUB' }, oneToOne)).resolves.toBe(
      false
    );
  });

  it('una pública la ve cualquiera y el admin ve todo', async () => {
    const publicSession = { playerId: null, coachId: null, clubId: null, visibility: 'PUBLIC' };
    const privateSession = {
      playerId: null,
      coachId: null,
      clubId: null,
      visibility: 'CLUB',
    };

    await expect(
      canViewLiveSession({ id: 'user-outsider', role: 'PLAYER' }, publicSession)
    ).resolves.toBe(true);
    await expect(
      canViewLiveSession({ id: 'user-admin', role: 'ADMIN' }, privateSession)
    ).resolves.toBe(true);
    await expect(
      canViewLiveSession({ id: 'user-outsider', role: 'PLAYER' }, privateSession)
    ).resolves.toBe(false);
  });
});
