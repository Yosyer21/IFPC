import { prisma } from '@ifpc/database';
import { notifyTrainingAudience } from '@/lib/training-notify';

/**
 * Publicación programada del Football Center. Vive aparte de `lib/training` a
 * propósito: solo depende de la base de datos y de los avisos, así que un script
 * o un cron (`pnpm scripts:publish-scheduled`) puede importarlo sin arrastrar la
 * sesión.
 *
 * Ojo: el contenido **ya se ve** cuando llega su fecha (lo garantiza
 * `trainingVisibilityWhere`); lo que hace este programador es avisar a la
 * audiencia y quitar la fecha para que el autor lo vea como «Published». Por eso
 * perder una pasada del cron no oculta contenido, solo retrasa el aviso.
 */
export async function publishDueTrainingContent(now: Date = new Date()): Promise<{ id: string }[]> {
  const due = await prisma.trainingContent.findMany({
    where: { status: 'PUBLISHED', publishAt: { not: null, lte: now } },
    select: { id: true, title: true, ownerType: true, coachId: true, clubId: true },
    take: 200,
  });
  if (due.length === 0) return [];

  for (const content of due) {
    await prisma.trainingContent.update({ where: { id: content.id }, data: { publishAt: null } });
    await notifyTrainingAudience(content);
  }

  return due.map((content) => ({ id: content.id }));
}
