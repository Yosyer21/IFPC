'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { isTrainingWeekday } from '@ifpc/config';
import { trainingSessionSchema } from '@ifpc/validation';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import {
  resolveTrainingVisibility,
  trainingAuthor,
  type TrainingAuthorRef,
  isTrainingVisibleNow,
} from '@/lib/training';
import {
  pendingRecipients,
  playerUserIds,
  resolveTrainingAssignment,
  sessionRecipients,
  targetCreateInput,
  targetUpdateInput,
} from '@/lib/training-assignments';
import { notifyIfNewlyVisible } from '@/lib/training-notify';

/**
 * Autoría de las **sesiones** (planes) del Football Center. Comparte con el
 * contenido la autoría derivada de la sesión, la propiedad comprobada en el
 * servidor y la visibilidad (borrador, programada o publicada).
 */

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/** Página del Football Center del autor (coach o club). */
function authorHome(author: TrainingAuthorRef): string {
  return author.coachId ? '/dashboard/coach/training' : '/dashboard/club/training';
}

/**
 * Rutas del autor que hay que refrescar al tocar una sesión. La pestaña
 * «Sessions» vive en la propia página del Football Center, así que basta con su
 * lista y la edición de la sesión.
 */
function sessionPaths(author: TrainingAuthorRef, sessionId?: string): string[] {
  const home = authorHome(author);
  return sessionId ? [home, `${home}/sessions/${sessionId}/edit`] : [home];
}

/** Día sugerido del formulario: solo los 0-6 del catálogo; lo demás, sin día. */
function weekdayFrom(formData: FormData): number | null {
  const raw = str(formData, 'weekday');
  if (raw === null) return null;
  const value = Number(raw);
  return isTrainingWeekday(value) ? value : null;
}

/** Sesión propia (coach o club), con la autoría comprobada en el servidor. */
async function findOwnedSession(sessionId: string) {
  if (!sessionId) return null;

  const session = await auth();
  if (!session?.user?.id) return null;

  const author = await trainingAuthor(session.user.id);
  if (!author.coachId && !author.clubId) return null;

  const row = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { targets: { select: { playerId: true } } },
  });
  if (!row) return null;

  const owns =
    (author.coachId !== null && row.coachId === author.coachId) ||
    (author.clubId !== null && row.clubId === author.clubId);
  return owns ? { row, author } : null;
}

/**
 * Crea una sesión para sus jugadores y lleva directo a montarla: una sesión vacía
 * no avisa a nadie, el aviso sale al publicarla con ejercicios dentro.
 */
export async function createTrainingSessionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const author = await trainingAuthor(session.user.id);
  if (!author.coachId && !author.clubId) {
    return { error: 'Only coaches and clubs can publish training sessions.' };
  }

  const parsed = trainingSessionSchema.safeParse({
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    weekday: weekdayFrom(formData),
  });
  if (!parsed.success) {
    return { error: 'Please review the session fields.' };
  }

  const visibility = resolveTrainingVisibility({
    mode: str(formData, 'visibility'),
    publishAt: str(formData, 'publishAt'),
  });
  if ('error' in visibility) {
    return { error: visibility.error };
  }

  const assignment = await resolveTrainingAssignment(formData, author);
  if ('error' in assignment) {
    return { error: assignment.error };
  }

  let created;
  try {
    created = await prisma.trainingSession.create({
      data: {
        ...parsed.data,
        status: visibility.status,
        publishAt: visibility.publishAt,
        ownerType: author.coachId ? 'COACH' : 'CLUB',
        coachId: author.coachId,
        clubId: author.clubId,
        ...targetCreateInput(assignment),
      },
    });
  } catch {
    return { error: 'The session could not be published.' };
  }

  revalidatePaths(...sessionPaths(author));
  redirect(`${authorHome(author)}/sessions/${created.id}/edit`);
}

/** Actualiza una sesión propia (misma validación que al crearla). */
export async function updateTrainingSessionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return { error: 'Session not found.' };
  }

  const parsed = trainingSessionSchema.safeParse({
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    weekday: weekdayFrom(formData),
  });
  if (!parsed.success) {
    return { error: 'Please review the session fields.' };
  }

  const visibility = resolveTrainingVisibility({
    mode: str(formData, 'visibility'),
    publishAt: str(formData, 'publishAt'),
  });
  if ('error' in visibility) {
    return { error: visibility.error };
  }

  const assignment = await resolveTrainingAssignment(formData, owned.author);
  if ('error' in assignment) {
    return { error: assignment.error };
  }

  let updated;
  try {
    updated = await prisma.trainingSession.update({
      where: { id: owned.row.id },
      data: {
        ...parsed.data,
        status: visibility.status,
        publishAt: visibility.publishAt,
        ...targetUpdateInput(assignment),
      },
      include: { items: { select: { id: true } } },
    });
  } catch {
    return { error: 'The session could not be saved.' };
  }

  // Solo interesa avisar si la sesión ya tiene ejercicios dentro.
  if (updated.items.length > 0) {
    await notifyIfNewlyVisible(owned.row, {
      ...updated,
      notificationKind: 'session',
      targetPlayerIds: assignment.playerIds,
    });
  }

  revalidatePaths(...sessionPaths(owned.author, owned.row.id));
  redirect(authorHome(owned.author));
}

/**
 * Recuerda a los jugadores que todavía no han hecho los ejercicios de la sesión.
 * Como en el contenido, solo avisa a quien le falta.
 */
export async function nudgeTrainingSessionAction(formData: FormData): Promise<void> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return;
  }

  const session = await prisma.trainingSession.findUnique({
    where: { id: owned.row.id },
    include: {
      items: { select: { contentId: true } },
      targets: { select: { playerId: true } },
    },
  });
  if (!session) {
    return;
  }

  const recipients = pendingRecipients(
    await sessionRecipients({
      ...session,
      targetPlayerIds: session.targets.map((target) => target.playerId),
    })
  );
  const userIds = await playerUserIds(recipients.map((recipient) => recipient.playerId));
  for (const userId of userIds) {
    await notifyUser({
      userId,
      type: 'training',
      title: 'Training reminder',
      message: `${session.title} is still pending`,
      link: `/dashboard/player/training/sessions/${session.id}`,
    });
  }

  revalidatePaths(...sessionPaths(owned.author, owned.row.id));
  redirect(`${authorHome(owned.author)}/sessions/${owned.row.id}/edit`);
}

/** Borra una sesión propia (sus items caen en cascada, no el contenido). */
export async function deleteTrainingSessionAction(formData: FormData): Promise<void> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return;
  }

  await prisma.trainingSession.delete({ where: { id: owned.row.id } });
  revalidatePaths(...sessionPaths(owned.author));
  redirect(authorHome(owned.author));
}

/** Item de una sesión propia, con la sesión comprobada en el servidor. */
async function findOwnedSessionItem(itemId: string) {
  if (!itemId) return null;

  const item = await prisma.trainingSessionItem.findUnique({
    where: { id: itemId },
    select: { id: true, position: true, sessionId: true },
  });
  if (!item) return null;

  const owned = await findOwnedSession(item.sessionId);
  return owned ? { row: item, author: owned.author, sessionId: item.sessionId } : null;
}

/**
 * Publica ya una sesión propia (borrador o programada). El aviso sale solo si la
 * sesión tiene ejercicios dentro: publicar un plan vacío no dice nada.
 */
export async function publishTrainingSessionAction(formData: FormData): Promise<void> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return;
  }

  const updated = await prisma.trainingSession.update({
    where: { id: owned.row.id },
    data: { status: 'PUBLISHED', publishAt: null },
    include: { items: { select: { id: true } } },
  });

  if (updated.items.length > 0) {
    await notifyIfNewlyVisible(owned.row, {
      ...updated,
      notificationKind: 'session',
      targetPlayerIds: owned.row.targets.map((target) => target.playerId),
    });
  }

  revalidatePaths(...sessionPaths(owned.author, owned.row.id));
  redirect(authorHome(owned.author));
}

/** Devuelve la sesión a borrador: deja de llegar a los jugadores. */
export async function unpublishTrainingSessionAction(formData: FormData): Promise<void> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return;
  }

  await prisma.trainingSession.update({
    where: { id: owned.row.id },
    data: { status: 'DRAFT', publishAt: null },
  });

  revalidatePaths(...sessionPaths(owned.author, owned.row.id));
  redirect(authorHome(owned.author));
}

/**
 * Añade un ejercicio **propio** al final de la sesión: así una sesión de coach no
 * mezcla ejercicios de un club ni al revés. Si ya estaba dentro, no pasa nada.
 */
export async function addTrainingSessionItemAction(formData: FormData): Promise<void> {
  const owned = await findOwnedSession(str(formData, 'sessionId') ?? '');
  if (!owned) {
    return;
  }

  const contentId = str(formData, 'contentId');
  const editPath = `${authorHome(owned.author)}/sessions/${owned.row.id}/edit`;
  if (!contentId) {
    redirect(editPath);
  }

  const content = await prisma.trainingContent.findUnique({
    where: { id: contentId },
    select: { coachId: true, clubId: true },
  });
  const ownsContent =
    (owned.author.coachId !== null && content?.coachId === owned.author.coachId) ||
    (owned.author.clubId !== null && content?.clubId === owned.author.clubId);
  if (!content || !ownsContent) {
    redirect(editPath);
  }

  const last = await prisma.trainingSessionItem.findFirst({
    where: { sessionId: owned.row.id },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  try {
    await prisma.trainingSessionItem.create({
      data: { sessionId: owned.row.id, contentId, position: (last?.position ?? -1) + 1 },
    });
  } catch {
    // Ya estaba en la sesión (restricción única): para el autor no es un error.
  }

  // Un plan vacío no dice nada: el aviso sale al estrenar el primer ejercicio (si
  // la sesión ya estaba publicada) o al publicarla desde la tarjeta.
  if (last === null && isTrainingVisibleNow(owned.row)) {
    await notifyIfNewlyVisible(null, {
      ...owned.row,
      notificationKind: 'session',
      targetPlayerIds: owned.row.targets.map((target) => target.playerId),
    });
  }

  revalidatePaths(...sessionPaths(owned.author, owned.row.id));
  redirect(editPath);
}

/** Quita un ejercicio de la sesión (el ejercicio en sí no se toca). */
export async function removeTrainingSessionItemAction(formData: FormData): Promise<void> {
  const item = await findOwnedSessionItem(str(formData, 'itemId') ?? '');
  if (!item) {
    return;
  }

  await prisma.trainingSessionItem.delete({ where: { id: item.row.id } });
  revalidatePaths(...sessionPaths(item.author, item.sessionId));
  redirect(`${authorHome(item.author)}/sessions/${item.sessionId}/edit`);
}

/** Sube o baja un ejercicio en el orden de la sesión (intercambia posiciones). */
export async function moveTrainingSessionItemAction(formData: FormData): Promise<void> {
  const item = await findOwnedSessionItem(str(formData, 'itemId') ?? '');
  if (!item) {
    return;
  }

  const editPath = `${authorHome(item.author)}/sessions/${item.sessionId}/edit`;
  const items = await prisma.trainingSessionItem.findMany({
    where: { sessionId: item.sessionId },
    orderBy: { position: 'asc' },
    select: { id: true, position: true },
  });

  const index = items.findIndex((entry) => entry.id === item.row.id);
  const neighbour = items[str(formData, 'direction') === 'up' ? index - 1 : index + 1];
  if (index < 0 || !neighbour) {
    redirect(editPath);
  }

  // Intercambio de posiciones: no hay índice único por posición, solo por sesión.
  await prisma.$transaction([
    prisma.trainingSessionItem.update({
      where: { id: item.row.id },
      data: { position: neighbour.position },
    }),
    prisma.trainingSessionItem.update({
      where: { id: neighbour.id },
      data: { position: item.row.position },
    }),
  ]);

  revalidatePaths(...sessionPaths(item.author, item.sessionId));
  redirect(editPath);
}
