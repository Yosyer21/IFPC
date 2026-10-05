import { beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/lib/notifications/notify', () => ({ notifyUser: vi.fn() }));

import { removePlayerPhotoAction, updatePlayerPhotoAction } from '@/app/actions/player';

const REDIRECT_TARGET = '/dashboard/player/profile';

/** `redirect()` signals via a thrown NEXT_REDIRECT error; returns its target URL. */
async function captureRedirect(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      return digest.split(';')[2] ?? null;
    }
    throw error;
  }
}

function photo(type: string, bytes = 1024, name = 'photo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function formWith(file?: File): FormData {
  const formData = new FormData();
  if (file) formData.set('file', file);
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

describe('updatePlayerPhotoAction', () => {
  it('pide una imagen cuando no se envía archivo', async () => {
    const result = await updatePlayerPhotoAction({}, formWith());
    expect(result).toEqual({ error: 'Selecciona una imagen.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('rechaza tipos que no son JPG, PNG o WebP', async () => {
    const result = await updatePlayerPhotoAction({}, formWith(photo('application/pdf', 1024, 'doc.pdf')));
    expect(result).toEqual({ error: 'Only JPG, PNG or WebP images are allowed.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 2 MB', async () => {
    const result = await updatePlayerPhotoAction({}, formWith(photo('image/png', 3 * 1024 * 1024)));
    expect(result).toEqual({ error: 'La imagen debe pesar menos de 2 MB.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('guarda el archivo y actualiza User.image', async () => {
    const target = await captureRedirect(() =>
      updatePlayerPhotoAction({}, formWith(photo('image/png')))
    );

    expect(target).toBe(REDIRECT_TARGET);
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
      updatePlayerPhotoAction({}, formWith(photo('image/webp', 1024, 'a.webp')))
    );
    expect(String(mocks.writeFile.mock.calls[0]![0])).toMatch(/\.webp$/);
  });

  it('borra la foto anterior cuando era una subida local', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: '/uploads/photos/old.jpg' });
    await captureRedirect(() =>
      updatePlayerPhotoAction({}, formWith(photo('image/jpeg', 1024, 'a.jpg')))
    );
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
    expect(String(mocks.unlink.mock.calls[0]![0])).toContain('/public/uploads/photos/old.jpg');
  });

  it('no borra archivos externos (avatares remotos)', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: 'https://example.com/avatar.png' });
    await captureRedirect(() =>
      updatePlayerPhotoAction({}, formWith(photo('image/jpeg', 1024, 'a.jpg')))
    );
    expect(mocks.unlink).not.toHaveBeenCalled();
  });

  it('falla con sesión inválida', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await updatePlayerPhotoAction({}, formWith(photo('image/png')));
    expect(result).toEqual({ error: 'Invalid session.' });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});

describe('removePlayerPhotoAction', () => {
  it('deja User.image a null, borra el archivo y redirige', async () => {
    mocks.userFindUnique.mockResolvedValue({ image: '/uploads/photos/old.png' });

    const target = await captureRedirect(() => removePlayerPhotoAction());

    expect(target).toBe(REDIRECT_TARGET);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: null },
    });
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
  });

  it('no hace nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    const target = await captureRedirect(() => removePlayerPhotoAction());
    expect(target).toBeNull();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});
