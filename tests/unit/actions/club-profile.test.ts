import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clubFindUnique: vi.fn(),
  clubUpdate: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: { club: { findUnique: mocks.clubFindUnique, update: mocks.clubUpdate } },
}));

import { updateClubProfileAction } from '@/app/actions/club';

function form(fields: Record<string, string>, multiple: Record<string, string[]> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  for (const [key, values] of Object.entries(multiple)) {
    for (const value of values) formData.append(key, value);
  }
  return formData;
}

const baseFields = {
  name: 'CD Demo',
  country: 'Spain',
  city: 'Valencia',
  league: 'LaLiga',
  foundedYear: '1998',
  description: 'Youth academy with a residential programme.',
  headline: 'Youth academy · Valencia',
  accentColor: 'violet',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.clubFindUnique.mockResolvedValue({ id: 'club-1' });
  mocks.clubUpdate.mockResolvedValue({ id: 'club-1' });
});

describe('updateClubProfileAction', () => {
  it('guarda el perfil y vuelve a la página del club', async () => {
    const redirectTo = await captureRedirect(() =>
      updateClubProfileAction({}, form(baseFields, { tags: ['TRIALS', 'YOUTH'] }))
    );

    expect(mocks.clubUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.clubUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: 'club-1' },
      data: {
        name: 'CD Demo',
        country: 'Spain',
        city: 'Valencia',
        league: 'LaLiga',
        foundedYear: 1998,
        accentColor: 'violet',
        tags: ['TRIALS', 'YOUTH'],
      },
    });
    expect(redirectTo).toBe('/dashboard/club/profile');
  });

  it('descarta chips desconocidos, duplicados y sobrantes', async () => {
    await captureRedirect(() =>
      updateClubProfileAction(
        {},
        form(baseFields, { tags: ['TRIALS', 'TRIALS', 'NOPE', 'YOUTH', 'LOANS', 'WOMEN'] })
      )
    );

    expect(mocks.clubUpdate.mock.calls[0][0].data.tags).toEqual(['TRIALS', 'YOUTH', 'LOANS']);
  });

  it('normaliza el acento contra la paleta permitida', async () => {
    await captureRedirect(() =>
      updateClubProfileAction({}, form({ ...baseFields, accentColor: 'neon' }))
    );

    expect(mocks.clubUpdate.mock.calls[0][0].data.accentColor).toBe('emerald');
  });

  it('deja los campos opcionales vacíos como nulos', async () => {
    await captureRedirect(() =>
      updateClubProfileAction(
        {},
        form({ name: 'CD Demo', country: 'Spain', city: '', league: '', foundedYear: '' })
      )
    );

    expect(mocks.clubUpdate.mock.calls[0][0].data).toMatchObject({
      city: null,
      league: null,
      foundedYear: null,
    });
  });

  it('rechaza los datos inválidos sin tocar la base de datos', async () => {
    const state = await updateClubProfileAction({}, form({ ...baseFields, name: 'X' }));

    expect(state.error).toBeTruthy();
    expect(mocks.clubUpdate).not.toHaveBeenCalled();
  });

  it('falla si la sesión no tiene club', async () => {
    mocks.clubFindUnique.mockResolvedValue(null);

    const state = await updateClubProfileAction({}, form(baseFields));

    expect(state.error).toBe('Invalid club.');
    expect(mocks.clubUpdate).not.toHaveBeenCalled();
  });
});
