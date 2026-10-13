'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { isTrainingKind } from '@ifpc/config';
import { trainingContentSchema } from '@ifpc/validation';
import type { ActionState } from './auth';
import { dashboardPath } from '@/lib/safe-redirect';
import { playerTrainingAudience, trainingVisibilityWhere } from '@/lib/training';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const num = (formData: FormData, key: string): number | null => {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** `outcomes` llega de un textarea: una línea por resultado. */
function outcomesFrom(formData: FormData): string[] {
  const raw = str(formData, 'outcomes');
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * Autor del contenido de la sesión: un coach o un club. Los administradores
 * publican el contenido general desde el builder de admin, no aquí.
 */
async function getAuthor(userId: string) {
  const [coach, club] = await Promise.all([
    prisma.coach.findUnique({ where: { userId }, select: { id: true } }),
    prisma.club.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  return { coachId: coach?.id ?? null, clubId: club?.id ?? null };
}

/** Página del Football Center del autor (coach o club). */
function authorHome(author: { coachId: string | null; clubId: string | null }): string {
  return author.coachId ? '/dashboard/coach/training' : '/dashboard/club/training';
}

/**
 * Publica un curso o ejercicio en el Football Center. El coach solo puede crear
 * para sus jugadores y el club para los jugadores con contrato: el origen y el
 * autor se derivan de la sesión, nunca del formulario.
 */
export async function createTrainingContentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const author = await getAuthor(session.user.id);
  if (!author.coachId && !author.clubId) {
    return { error: 'Only coaches and clubs can publish training content.' };
  }

  const kind = str(formData, 'kind');
  const parsed = trainingContentSchema.safeParse({
    kind: isTrainingKind(kind) ? kind : 'COURSE',
    category: str(formData, 'category'),
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    content: str(formData, 'content'),
    outcomes: outcomesFrom(formData),
    videoUrl: str(formData, 'videoUrl'),
    durationMinutes: num(formData, 'durationMinutes'),
    difficulty: num(formData, 'difficulty'),
  });
  if (!parsed.success) {
    return { error: 'Please review the content fields.' };
  }

  try {
    await prisma.trainingContent.create({
      data: {
        ...parsed.data,
        ownerType: author.coachId ? 'COACH' : 'CLUB',
        coachId: author.coachId,
        clubId: author.clubId,
      },
    });
  } catch {
    return { error: 'The content could not be published.' };
  }

  redirect(authorHome(author));
}

/** Borra contenido propio (un coach solo lo suyo; un club, el suyo). */
export async function deleteTrainingContentAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const contentId = str(formData, 'contentId');
  if (!contentId) {
    return;
  }

  const author = await getAuthor(session.user.id);
  const content = await prisma.trainingContent.findUnique({
    where: { id: contentId },
    select: { coachId: true, clubId: true },
  });
  const isOwner =
    (author.coachId !== null && content?.coachId === author.coachId) ||
    (author.clubId !== null && content?.clubId === author.clubId);
  if (!content || !isOwner) {
    return;
  }

  await prisma.trainingContent.delete({ where: { id: contentId } });
  redirect(authorHome(author));
}

/**
 * Marca (o desmarca) un curso o ejercicio como completado. Solo el contenido que
 * el jugador puede ver, y el progreso siempre se guarda sobre su propio `Player`.
 */
export async function toggleTrainingProgressAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const contentId = str(formData, 'contentId');
  if (!contentId) {
    return;
  }

  const audience = await playerTrainingAudience(session.user.id);
  if (!audience.playerId) {
    return;
  }

  const visible = await prisma.trainingContent.findFirst({
    where: { id: contentId, AND: [trainingVisibilityWhere(audience)] },
    select: { id: true },
  });
  if (!visible) {
    return;
  }

  const key = { playerId: audience.playerId, contentId };
  const existing = await prisma.trainingProgress.findUnique({
    where: { playerId_contentId: key },
    select: { completedAt: true },
  });

  if (existing?.completedAt) {
    await prisma.trainingProgress.delete({ where: { playerId_contentId: key } });
  } else {
    const completedAt = new Date();
    await prisma.trainingProgress.upsert({
      where: { playerId_contentId: key },
      update: { completedAt },
      create: { ...key, completedAt },
    });
  }

  redirect(dashboardPath(formData.get('redirectTo')));
}
