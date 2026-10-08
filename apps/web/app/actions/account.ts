'use server';

import { redirect } from 'next/navigation';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { dashboardPath } from '@/lib/safe-redirect';
import type { ActionState } from './auth';

/** Accepted profile photo types mapped to the extension we store them with. */
const PHOTO_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Absolute directory holding profile photos inside the public uploads folder. */
const PHOTO_DIR = path.join(process.cwd(), 'public', 'uploads', 'photos');

/** Best-effort removal of a previously uploaded local photo (never throws). */
async function removeLocalPhoto(image: string | null): Promise<void> {
  if (!image?.startsWith('/uploads/photos/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', image.replace(/^\//, '')));
  } catch {
    // The file may already be gone: nothing to clean up.
  }
}

/**
 * Sube/reemplaza la foto de perfil del usuario autenticado (`User.image`), el
 * campo que renderiza el avatar compartido. Sirve para **cualquier rol**.
 */
export async function updateProfilePhotoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona una imagen.' };
  }
  const ext = PHOTO_MIME_EXT[file.type];
  if (!ext) {
    return { error: 'Only JPG, PNG or WebP images are allowed.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: 'La imagen debe pesar menos de 2 MB.' };
  }

  const backTo = dashboardPath(formData.get('redirectTo'));

  try {
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    await mkdir(PHOTO_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(PHOTO_DIR, filename), Buffer.from(await file.arrayBuffer()));
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: `/uploads/photos/${filename}` },
    });
    await removeLocalPhoto(previous?.image ?? null);
  } catch {
    return { error: 'No se pudo guardar la foto.' };
  }

  redirect(backTo);
}

/** Quita la foto de perfil del usuario autenticado (y el fichero local). */
export async function removeProfilePhotoAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  await removeLocalPhoto(user?.image ?? null);

  redirect(dashboardPath(formData.get('redirectTo')));
}
