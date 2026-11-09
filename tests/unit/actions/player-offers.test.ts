import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  playerFindUnique: vi.fn(),
  trialFindFirst: vi.fn(),
  trialUpdate: vi.fn(),
  negotiationFindFirst: vi.fn(),
  negotiationUpdate: vi.fn(),
  parentChildFindMany: vi.fn(),
  notifyUser: vi.fn(),
  revalidatePaths: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    player: { findUnique: mocks.playerFindUnique },
    trial: { findFirst: mocks.trialFindFirst, update: mocks.trialUpdate },
    negotiation: { findFirst: mocks.negotiationFindFirst, update: mocks.negotiationUpdate },
    parentChild: { findMany: mocks.parentChildFindMany },
  },
}));
vi.mock('@/lib/notifications/notify', () => ({ notifyUser: mocks.notifyUser }));
vi.mock('@/lib/revalidate', () => ({ revalidatePaths: mocks.revalidatePaths }));

import { declineOfferAction, requestOfferApprovalAction } from '@/app/actions/player';

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const PLAYER = { id: 'player-1', firstName: 'Demo', lastName: 'Player' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.playerFindUnique.mockResolvedValue(PLAYER);
  mocks.parentChildFindMany.mockResolvedValue([{ parent: { userId: 'parent-user-1' } }]);
  mocks.notifyUser.mockResolvedValue(undefined);
});

describe('requestOfferApprovalAction', () => {
  it('rechaza una sesión inválida', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await requestOfferApprovalAction(
      {},
      form({ kind: 'TRIAL', offerId: 'trial-1' })
    );
    expect(result).toEqual({ error: 'Invalid session.' });
  });

  it('rechaza un tipo de oferta desconocido', async () => {
    const result = await requestOfferApprovalAction({}, form({ kind: 'FOO', offerId: 'trial-1' }));
    expect(result).toEqual({ error: 'Invalid offer.' });
    expect(mocks.trialFindFirst).not.toHaveBeenCalled();
  });

  it('no acepta una prueba de otro jugador', async () => {
    mocks.trialFindFirst.mockResolvedValue(null);
    const result = await requestOfferApprovalAction(
      {},
      form({ kind: 'TRIAL', offerId: 'trial-9' })
    );
    expect(result).toEqual({ error: 'Offer not found.' });
    expect(mocks.notifyUser).not.toHaveBeenCalled();
  });

  it('avisa a cada padre vinculado y devuelve el acuse', async () => {
    mocks.trialFindFirst.mockResolvedValue({ id: 'trial-1', club: { name: 'Demo Club' } });
    mocks.parentChildFindMany.mockResolvedValue([
      { parent: { userId: 'parent-user-1' } },
      { parent: { userId: 'parent-user-2' } },
    ]);

    const result = await requestOfferApprovalAction(
      {},
      form({ kind: 'TRIAL', offerId: 'trial-1' })
    );

    expect(result).toEqual({ success: 'Sent to your parent for approval.' });
    expect(mocks.parentChildFindMany).toHaveBeenCalledWith({
      where: { playerId: 'player-1' },
      select: { parent: { select: { userId: true } } },
    });
    expect(mocks.notifyUser).toHaveBeenCalledTimes(2);
    expect(mocks.notifyUser).toHaveBeenCalledWith({
      userId: 'parent-user-1',
      type: 'application',
      title: 'Approval needed: transfer offer',
      message: 'Demo Player wants to accept the offer from Demo Club.',
      link: '/dashboard/parent/children/player-1/opportunities',
    });
    expect(mocks.revalidatePaths).toHaveBeenCalledWith(
      '/dashboard/player/opportunities',
      '/dashboard/parent'
    );
  });

  it('pide vincular a un familiar si no hay padres', async () => {
    mocks.trialFindFirst.mockResolvedValue({ id: 'trial-1', club: { name: 'Demo Club' } });
    mocks.parentChildFindMany.mockResolvedValue([]);

    const result = await requestOfferApprovalAction(
      {},
      form({ kind: 'TRIAL', offerId: 'trial-1' })
    );

    expect(result).toEqual({
      error: 'Link a parent or guardian to your account to send the acceptance.',
    });
    expect(mocks.notifyUser).not.toHaveBeenCalled();
  });

  it('acepta también ofertas de contrato (negociación)', async () => {
    mocks.negotiationFindFirst.mockResolvedValue({
      id: 'neg-1',
      club: { name: 'Striker Madrid' },
    });

    const result = await requestOfferApprovalAction(
      {},
      form({ kind: 'NEGOTIATION', offerId: 'neg-1' })
    );

    expect(result).toEqual({ success: 'Sent to your parent for approval.' });
    expect(mocks.negotiationFindFirst).toHaveBeenCalledWith({
      where: { id: 'neg-1', playerId: 'player-1' },
      include: { club: true },
    });
    expect(mocks.notifyUser.mock.calls[0][0].message).toBe(
      'Demo Player wants to accept the offer from Striker Madrid.'
    );
  });
});

describe('declineOfferAction', () => {
  it('cancela la prueba del propio jugador', async () => {
    mocks.trialFindFirst.mockResolvedValue({ id: 'trial-1' });

    const result = await declineOfferAction({}, form({ kind: 'TRIAL', offerId: 'trial-1' }));

    expect(result).toEqual({ success: 'Offer declined.' });
    expect(mocks.trialUpdate).toHaveBeenCalledWith({
      where: { id: 'trial-1' },
      data: { status: 'CANCELLED' },
    });
    expect(mocks.revalidatePaths).toHaveBeenCalledWith('/dashboard/player/opportunities');
  });

  it('rechaza la negociación del propio jugador', async () => {
    mocks.negotiationFindFirst.mockResolvedValue({ id: 'neg-1' });

    const result = await declineOfferAction({}, form({ kind: 'NEGOTIATION', offerId: 'neg-1' }));

    expect(result).toEqual({ success: 'Offer declined.' });
    expect(mocks.negotiationUpdate).toHaveBeenCalledWith({
      where: { id: 'neg-1' },
      data: { status: 'REJECTED' },
    });
  });

  it('no toca ofertas de otros jugadores', async () => {
    mocks.trialFindFirst.mockResolvedValue(null);

    const result = await declineOfferAction({}, form({ kind: 'TRIAL', offerId: 'trial-9' }));

    expect(result).toEqual({ error: 'Offer not found.' });
    expect(mocks.trialUpdate).not.toHaveBeenCalled();
  });

  it('rechaza una sesión inválida', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await declineOfferAction({}, form({ kind: 'TRIAL', offerId: 'trial-1' }));
    expect(result).toEqual({ error: 'Invalid session.' });
  });
});
