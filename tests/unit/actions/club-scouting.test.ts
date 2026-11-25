import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clubFindUnique: vi.fn(),
  playerFindUnique: vi.fn(),
  shortlistFindUnique: vi.fn(),
  shortlistCreate: vi.fn(),
  shortlistDelete: vi.fn(),
  trialFindFirst: vi.fn(),
  trialCreate: vi.fn(),
  notifyUser: vi.fn(),
  revalidatePaths: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    club: { findUnique: mocks.clubFindUnique },
    player: { findUnique: mocks.playerFindUnique },
    clubShortlist: {
      findUnique: mocks.shortlistFindUnique,
      create: mocks.shortlistCreate,
      delete: mocks.shortlistDelete,
    },
    trial: { findFirst: mocks.trialFindFirst, create: mocks.trialCreate },
  },
}));
vi.mock('@/lib/notifications/notify', () => ({ notifyUser: mocks.notifyUser }));
vi.mock('@/lib/revalidate', () => ({ revalidatePaths: mocks.revalidatePaths }));

import { invitePlayerToTrialAction, toggleClubShortlistAction } from '@/app/actions/club';

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const CLUB = {
  id: 'club-1',
  name: 'Demo Club',
  city: 'Valencia',
  country: 'Spain',
  verified: true,
  backgroundChecked: true,
};
const BACK = '/dashboard/club/players?position=forwards';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-club' } });
  mocks.clubFindUnique.mockResolvedValue(CLUB);
  mocks.playerFindUnique.mockResolvedValue({ id: 'player-1' });
  mocks.shortlistFindUnique.mockResolvedValue(null);
  mocks.shortlistCreate.mockResolvedValue({});
  mocks.shortlistDelete.mockResolvedValue({});
  mocks.trialFindFirst.mockResolvedValue(null);
  mocks.trialCreate.mockResolvedValue({ id: 'trial-1' });
  mocks.notifyUser.mockResolvedValue(undefined);
});

describe('toggleClubShortlistAction', () => {
  it('añade el jugador a la shortlist y vuelve a la página con filtros', async () => {
    const target = await captureRedirect(() =>
      toggleClubShortlistAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(target).toBe(BACK);
    expect(mocks.shortlistCreate).toHaveBeenCalledWith({
      data: { clubId: 'club-1', playerId: 'player-1' },
    });
    expect(mocks.revalidatePaths).toHaveBeenCalledWith('/dashboard/club/players');
  });

  it('si ya estaba, la quita', async () => {
    mocks.shortlistFindUnique.mockResolvedValue({ id: 'shortlist-1' });

    await captureRedirect(() =>
      toggleClubShortlistAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(mocks.shortlistDelete).toHaveBeenCalledWith({ where: { id: 'shortlist-1' } });
    expect(mocks.shortlistCreate).not.toHaveBeenCalled();
  });

  it('no guarda un jugador que no existe', async () => {
    mocks.playerFindUnique.mockResolvedValue(null);

    const target = await captureRedirect(() =>
      toggleClubShortlistAction(form({ playerId: 'missing', returnTo: BACK }))
    );

    expect(target).toBe(BACK);
    expect(mocks.shortlistCreate).not.toHaveBeenCalled();
  });

  it('ignora destinos externos y vuelve a Find players', async () => {
    const target = await captureRedirect(() =>
      toggleClubShortlistAction(
        form({ playerId: 'player-1', returnTo: 'https://evil.example/phish' })
      )
    );
    expect(target).toBe('/dashboard/club/players');
  });

  it('sin club no hace nada', async () => {
    mocks.clubFindUnique.mockResolvedValue(null);
    const target = await captureRedirect(() =>
      toggleClubShortlistAction(form({ playerId: 'player-1' }))
    );
    expect(target).toBeNull();
    expect(mocks.shortlistCreate).not.toHaveBeenCalled();
  });
});

describe('invitePlayerToTrialAction', () => {
  beforeEach(() => {
    mocks.playerFindUnique.mockResolvedValue({
      id: 'player-1',
      firstName: 'Demo',
      lastName: 'Player',
      userId: 'user-player',
      parents: [{ parent: { userId: 'user-parent-1' } }, { parent: { userId: 'user-parent-2' } }],
    });
  });

  it('crea la prueba, avisa al jugador y a su familia y vuelve atrás', async () => {
    const before = Date.now();
    const target = await captureRedirect(() =>
      invitePlayerToTrialAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(target).toBe(BACK);
    expect(mocks.trialCreate).toHaveBeenCalledTimes(1);
    const data = mocks.trialCreate.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      clubId: 'club-1',
      playerId: 'player-1',
      status: 'SCHEDULED',
      location: 'Valencia',
    });
    expect(data.startsAt).toBeInstanceOf(Date);
    const days = (data.startsAt.getTime() - before) / 86_400_000;
    // `startsAt` cae a las 10:00 UTC dentro de ~7 días, así que el delta depende
    // de la hora actual (entre 6 y 7 días). El rango debe ser robusto a la hora.
    expect(days).toBeGreaterThan(5.9);
    expect(days).toBeLessThan(7.1);

    expect(mocks.notifyUser).toHaveBeenCalledTimes(3);
    expect(mocks.notifyUser.mock.calls[0]![0]).toMatchObject({
      userId: 'user-player',
      title: 'Trial invitation',
      link: '/dashboard/player/opportunities',
    });
    expect(mocks.notifyUser.mock.calls[1]![0]).toMatchObject({
      userId: 'user-parent-1',
      link: '/dashboard/calendar',
    });
    expect(mocks.revalidatePaths).toHaveBeenCalledWith(
      '/dashboard/club/players',
      '/dashboard/player/calendar',
      '/dashboard/calendar',
      '/dashboard/parent/approvals',
      '/dashboard/parent'
    );
  });

  it('deja la invitación pendiente del padre si el jugador es menor de 16', async () => {
    mocks.playerFindUnique.mockResolvedValue({
      id: 'player-1',
      firstName: 'Demo',
      lastName: 'Player',
      userId: 'user-player',
      dateOfBirth: new Date('2012-01-01'),
      parents: [{ idVisibleToClubs: true, parent: { userId: 'user-parent-1' } }],
    });

    await captureRedirect(() =>
      invitePlayerToTrialAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(mocks.trialCreate.mock.calls[0]![0].data).toMatchObject({
      status: 'SCHEDULED',
      parentApproval: 'PENDING',
    });
    expect(mocks.notifyUser.mock.calls[0]![0]).toMatchObject({
      userId: 'user-player',
      title: 'Trial invitation — waiting for your parent',
      link: '/dashboard/player/opportunities',
    });
    expect(mocks.notifyUser.mock.calls[1]![0]).toMatchObject({
      userId: 'user-parent-1',
      link: '/dashboard/parent/approvals',
    });
  });

  it('es idempotente si ya hay una prueba programada', async () => {
    mocks.trialFindFirst.mockResolvedValue({ id: 'trial-existing' });

    await captureRedirect(() =>
      invitePlayerToTrialAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(mocks.trialCreate).not.toHaveBeenCalled();
    expect(mocks.notifyUser).not.toHaveBeenCalled();
  });

  it('no invita a un jugador inexistente', async () => {
    mocks.playerFindUnique.mockResolvedValue(null);
    const target = await captureRedirect(() =>
      invitePlayerToTrialAction(form({ playerId: 'missing', returnTo: BACK }))
    );
    expect(target).toBe(BACK);
    expect(mocks.trialCreate).not.toHaveBeenCalled();
  });

  it('no invita si el club no está verificado o sin antecedentes', async () => {
    mocks.clubFindUnique.mockResolvedValue({ ...CLUB, verified: false });

    const target = await captureRedirect(() =>
      invitePlayerToTrialAction(form({ playerId: 'player-1', returnTo: BACK }))
    );

    expect(target).toBe(BACK);
    expect(mocks.trialCreate).not.toHaveBeenCalled();
  });
});
