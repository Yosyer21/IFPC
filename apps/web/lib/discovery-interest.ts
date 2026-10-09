import { prisma } from '@ifpc/database';

/**
 * "No me interesa": preferencias del espectador sobre publicaciones concretas.
 *
 * No es moderación (no oculta la publicación a nadie más) ni privacidad (no
 * cambia lo que ve el autor): solo la quita de **sus** listados, y se puede
 * deshacer desde el detalle de la publicación.
 */

/** Ids de las publicaciones que el espectador marcó como "no me interesa". */
export async function notInterestedPostIds(viewerId?: string | null): Promise<string[]> {
  if (!viewerId) return [];

  const rows = await prisma.postNotInterested.findMany({
    where: { userId: viewerId },
    select: { postId: true },
  });
  return rows.map((row) => row.postId);
}

/** ¿El espectador marcó esta publicación como "no me interesa"? */
export async function isNotInterested(input: {
  postId: string;
  viewerId?: string | null;
}): Promise<boolean> {
  if (!input.viewerId) return false;

  const row = await prisma.postNotInterested.findUnique({
    where: { postId_userId: { postId: input.postId, userId: input.viewerId } },
    select: { id: true },
  });
  return row !== null;
}

/** Marca o desmarca una publicación (idempotente). */
export async function setNotInterested(input: {
  postId: string;
  userId: string;
  value: boolean;
}): Promise<void> {
  if (input.value) {
    await prisma.postNotInterested.upsert({
      where: { postId_userId: { postId: input.postId, userId: input.userId } },
      create: { postId: input.postId, userId: input.userId },
      update: {},
    });
    return;
  }

  await prisma.postNotInterested.deleteMany({
    where: { postId: input.postId, userId: input.userId },
  });
}
