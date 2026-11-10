import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  storageSave: vi.fn(),
  storageRemove: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
  },
}));
vi.mock('@/lib/storage', () => ({
  resolveStorage: () => ({
    kind: 's3',
    save: mocks.storageSave,
    remove: mocks.storageRemove,
  }),
}));

import { removeProfilePhotoAction, updateProfilePhotoAction } from '@/app/actions/account';

function photo(type: string, bytes = 1024, name = 'photo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function form(fields: Record<string, string | File> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.userFindUnique.mockResolvedValue({ image: null });
  mocks.userUpdate.mockResolvedValue({});
  mocks.storageSave.mockResolvedValue({ url: '/api/files/photos/new.png' });
  mocks.storageRemove.mockResolvedValue(undefined);
});

describe('updateProfilePhotoAction', () => {
  it('pide una imagen cuando no se envía archivo', async () => {
    const result = await updateProfilePhotoAction({}, form());
    expect(result).toEqual({ error: 'Select an image.' });
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });

  it('rechaza tipos que no son JPG, PNG or WebP', async () => {
    const result = await updateProfilePhotoAction(
      {},
      form({ file: photo('application/pdf', 1024, 'doc.pdf') })
    );
    expect(result).toEqual({ error: 'Only JPG, PNG or WebP images are allowed.' });
    expect(mocks.storageSave).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 2 MB', async () => {
    const result = await updateProfilePhotoAction(
      {},
      form({ file: photo('image/png', 3 * 1024 * 1024) })
    );
    expect(result).toEqual({ error: 'The image must be under 2 MB.' });
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });

  it('guarda la foto con el driver (disco o bucket) y actualiza User.image', async () => {
    const target = await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/png') }))
    );

    expect(target).toBe('/dashboard');
    expect(mocks.storageSave).toHaveBeenCalledTimes(1);
    const saved = mocks.storageSave.mock.calls[0]![0];
    expect(saved.key).toMatch(/^photos\/[\w-]+\.png$/);
    expect(saved.body).toBeInstanceOf(Buffer);
    expect(saved.contentType).toBe('image/png');

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: '/api/files/photos/new.png' },
    });
  });

  it('extrae la extensión correcta según el tipo MIME', async () => {
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/webp', 1024, 'a.webp') }))
    );
    expect(mocks.storageSave.mock.calls[0]![0].key).toMatch(/\.webp$/);
  });

  it('vuelve a la página interna indicada', async () => {
    const target = await captureRedirect(() =>
      updateProfilePhotoAction(
        {},
        form({ file: photo('image/png'), redirectTo: '/dashboard/club/profile' })
      )
    );
    expect(target).toBe('/dashboard/club/profile');
  });

  it('ignora destinos externos (no hay open redirect)', async () => {
    for (const redirectTo of [
      'https://evil.example',
      '//evil.example',
      '/login',
      '/dashboard/../x',
    ]) {
      const target = await captureRedirect(() =>
        updateProfilePhotoAction({}, form({ file: photo('image/png'), redirectTo }))
      );
      expect(target).toBe('/dashboard');
    }
  });

  it('pasa la foto anterior al driver para que la borre si es suya', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: '/uploads/photos/old.jpg' });
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/jpeg', 1024, 'a.jpg') }))
    );
    expect(mocks.storageRemove).toHaveBeenCalledWith('/uploads/photos/old.jpg');
  });

  it('también pasa URLs externas: el driver las ignora', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: 'https://example.com/avatar.png' });
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/jpeg', 1024, 'a.jpg') }))
    );
    expect(mocks.storageRemove).toHaveBeenCalledWith('https://example.com/avatar.png');
  });

  it('fails with an invalid session', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await updateProfilePhotoAction({}, form({ file: photo('image/png') }));
    expect(result).toEqual({ error: 'Invalid session.' });
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });
});

describe('removeProfilePhotoAction', () => {
  it('deja User.image a null, borra el archivo y vuelve al destino indicado', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: '/uploads/photos/old.png' });

    const target = await captureRedirect(() =>
      removeProfilePhotoAction(form({ redirectTo: '/dashboard/parent/settings' }))
    );

    expect(target).toBe('/dashboard/parent/settings');
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: null },
    });
    expect(mocks.storageRemove).toHaveBeenCalledWith('/uploads/photos/old.png');
  });

  it('sin destino válido vuelve a /dashboard', async () => {
    const target = await captureRedirect(() =>
      removeProfilePhotoAction(form({ redirectTo: 'https://evil.example' }))
    );
    expect(target).toBe('/dashboard');
  });

  it('does nothing without a session', async () => {
    mocks.auth.mockResolvedValue(null);
    const target = await captureRedirect(() => removeProfilePhotoAction(form()));
    expect(target).toBeNull();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});
