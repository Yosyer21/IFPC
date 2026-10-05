import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
  },
}));
vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
  unlink: mocks.unlink,
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
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.unlink.mockResolvedValue(undefined);
});

describe('updateProfilePhotoAction', () => {
  it('pide una imagen cuando no se envía archivo', async () => {
    const result = await updateProfilePhotoAction({}, form());
    expect(result).toEqual({ error: 'Selecciona una imagen.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('rechaza tipos que no son JPG, PNG o WebP', async () => {
    const result = await updateProfilePhotoAction(
      {},
      form({ file: photo('application/pdf', 1024, 'doc.pdf') })
    );
    expect(result).toEqual({ error: 'Only JPG, PNG or WebP images are allowed.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 2 MB', async () => {
    const result = await updateProfilePhotoAction(
      {},
      form({ file: photo('image/png', 3 * 1024 * 1024) })
    );
    expect(result).toEqual({ error: 'La imagen debe pesar menos de 2 MB.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('guarda el archivo y actualiza User.image', async () => {
    const target = await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/png') }))
    );

    expect(target).toBe('/dashboard');
    expect(mocks.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('/public/uploads/photos'),
      { recursive: true }
    );

    const [filePath, buffer] = mocks.writeFile.mock.calls[0]!;
    expect(String(filePath)).toContain('/public/uploads/photos/');
    expect(String(filePath)).toMatch(/\.png$/);
    expect(buffer).toBeInstanceOf(Buffer);

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: expect.stringMatching(/^\/uploads\/photos\/[\w-]+\.png$/) },
    });
  });

  it('extrae la extensión correcta según el tipo MIME', async () => {
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/webp', 1024, 'a.webp') }))
    );
    expect(String(mocks.writeFile.mock.calls[0]![0])).toMatch(/\.webp$/);
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
    for (const redirectTo of ['https://evil.example', '//evil.example', '/login', '/dashboard/../x']) {
      const target = await captureRedirect(() =>
        updateProfilePhotoAction({}, form({ file: photo('image/png'), redirectTo }))
      );
      expect(target).toBe('/dashboard');
    }
  });

  it('borra la foto anterior cuando era una subida local', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: '/uploads/photos/old.jpg' });
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/jpeg', 1024, 'a.jpg') }))
    );
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
    expect(String(mocks.unlink.mock.calls[0]![0])).toContain('/public/uploads/photos/old.jpg');
  });

  it('no borra archivos externos (avatares remotos)', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: 'https://example.com/avatar.png' });
    await captureRedirect(() =>
      updateProfilePhotoAction({}, form({ file: photo('image/jpeg', 1024, 'a.jpg') }))
    );
    expect(mocks.unlink).not.toHaveBeenCalled();
  });

  it('falla con sesión inválida', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await updateProfilePhotoAction({}, form({ file: photo('image/png') }));
    expect(result).toEqual({ error: 'Invalid session.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
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
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
  });

  it('sin destino válido vuelve a /dashboard', async () => {
    const target = await captureRedirect(() =>
      removeProfilePhotoAction(form({ redirectTo: 'https://evil.example' }))
    );
    expect(target).toBe('/dashboard');
  });

  it('no hace nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    const target = await captureRedirect(() => removeProfilePhotoAction(form()));
    expect(target).toBeNull();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});
