import { prisma } from '@ifpc/database';

/**
 * Publicación programada de Discovery. Vive aparte de `lib/discovery` a propósito:
 * este módulo solo depende de la base de datos, así que un script o un cron
 * (`pnpm scripts:publish-scheduled`) puede importarlo sin arrastrar la sesión.
 */
export async function publishDuePosts(now: Date = new Date()): Promise<{ id: string }[]> {
  const due = await prisma.post.findMany({
    where: { status: 'DRAFT', publishAt: { not: null, lte: now } },
    select: { id: true },
    take: 200,
  });
  if (due.length === 0) return [];

  await prisma.post.updateMany({
    where: { id: { in: due.map((post) => post.id) } },
    data: { status: 'PUBLISHED' },
  });
  return due;
}
