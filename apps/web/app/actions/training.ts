'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import {
  TRAINING_IMAGE_MAX_BYTES,
  TRAINING_IMAGE_MIME_EXT,
  TRAINING_VIDEO_MAX_BYTES,
  TRAINING_VIDEO_MIME_EXT,
  isTrainingEquipment,
  isTrainingKind,
  type TrainingEquipment,
} from '@ifpc/config';
import { trainingContentSchema } from '@ifpc/validation';
import type { ActionState } from './auth';
import { dashboardPath } from '@/lib/safe-redirect';
import { revalidatePaths } from '@/lib/revalidate';
import { resolveStorage } from '@/lib/storage';
import {
  parsePassScore,
  parseQuizQuestions,
  quizDelete,
  replaceContentQuiz,
} from '@/lib/training-quiz';
import {
  playerTrainingAudience,
  resolveTrainingVisibility,
  trainingAuthor,
  trainingVisibilityWhere,
} from '@/lib/training';
import { notifyIfNewlyVisible } from '@/lib/training-notify';

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
 * `equipment` llega como casillas repetidas: se queda solo con el material del
 * catálogo (nunca con lo que envíe a mano un cliente).
 */
function equipmentFrom(formData: FormData): TrainingEquipment[] {
  return formData.getAll('equipment').filter(isTrainingEquipment).slice(0, 12);
}

/** Página del Football Center del autor (coach o club). */
function authorHome(author: { coachId: string | null; clubId: string | null }): string {
  return author.coachId ? '/dashboard/coach/training' : '/dashboard/club/training';
}

/**
 * Rutas del autor que hay que refrescar tras publicar, editar o borrar: la lista,
 * el detalle y la página de edición. Sin esto el router sirve la versión cacheada
 * y los cambios no se ven hasta recargar.
 */
function authorPaths(
  author: { coachId: string | null; clubId: string | null },
  contentId?: string
): string[] {
  const base = authorHome(author);
  return contentId ? [base, `${base}/${contentId}`, `${base}/${contentId}/edit`] : [base];
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

  const author = await trainingAuthor(session.user.id);
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
    series: num(formData, 'series'),
    reps: str(formData, 'reps'),
    restSeconds: num(formData, 'restSeconds'),
    space: str(formData, 'space'),
    players: str(formData, 'players'),
    equipment: equipmentFrom(formData),
  });
  if (!parsed.success) {
    return { error: 'Please review the content fields.' };
  }

  const visibility = resolveTrainingVisibility({
    mode: str(formData, 'visibility'),
    publishAt: str(formData, 'publishAt'),
  });
  if ('error' in visibility) {
    return { error: visibility.error };
  }

  let created;
  try {
    created = await prisma.trainingContent.create({
      data: {
        ...parsed.data,
        status: visibility.status,
        publishAt: visibility.publishAt,
        ownerType: author.coachId ? 'COACH' : 'CLUB',
        coachId: author.coachId,
        clubId: author.clubId,
      },
    });
  } catch {
    return { error: 'The content could not be published.' };
  }

  await notifyIfNewlyVisible(null, created);
  revalidatePaths(...authorPaths(author));
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

  const author = await trainingAuthor(session.user.id);
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
  revalidatePaths(...authorPaths(author));
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

  revalidatePaths('/dashboard/player/training', `/dashboard/player/training/${contentId}`);
  redirect(dashboardPath(formData.get('redirectTo')));
}

// ---------------------------------------------------------------------------
// Edición del contenido propio (coach o club)
// ---------------------------------------------------------------------------

/** Página de edición del contenido según quién lo publica. */
function trainingEditPath(
  author: { coachId: string | null; clubId: string | null },
  contentId: string
): string {
  return author.coachId
    ? `/dashboard/coach/training/${contentId}/edit`
    : `/dashboard/club/training/${contentId}/edit`;
}

/**
 * Contenido del propio autor (coach o club) junto a su autoría. Devuelve `null`
 * si no hay sesión, la sesión no publica contenido o el contenido no es suyo:
 * editar, subir medios y crear quizzes pasan siempre por aquí.
 */
async function findOwnedContent(contentId: string) {
  if (!contentId) return null;

  const session = await auth();
  if (!session?.user?.id) return null;

  const author = await trainingAuthor(session.user.id);
  if (!author.coachId && !author.clubId) return null;

  const content = await prisma.trainingContent.findUnique({ where: { id: contentId } });
  if (!content) return null;

  const owns =
    (author.coachId !== null && content.coachId === author.coachId) ||
    (author.clubId !== null && content.clubId === author.clubId);
  return owns ? { content, author } : null;
}

/**
 * Actualiza un curso o ejercicio del propio autor. Misma validación que al
 * publicar y autoría comprobada en el servidor (un coach no puede editar el
 * contenido de un club ni al revés).
 */
export async function updateTrainingContentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return { error: 'Content not found.' };
  }

  const kind = str(formData, 'kind');
  const parsed = trainingContentSchema.safeParse({
    kind: isTrainingKind(kind) ? kind : owned.content.kind,
    category: str(formData, 'category'),
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    content: str(formData, 'content'),
    outcomes: outcomesFrom(formData),
    videoUrl: str(formData, 'videoUrl'),
    durationMinutes: num(formData, 'durationMinutes'),
    difficulty: num(formData, 'difficulty'),
    series: num(formData, 'series'),
    reps: str(formData, 'reps'),
    restSeconds: num(formData, 'restSeconds'),
    space: str(formData, 'space'),
    players: str(formData, 'players'),
    equipment: equipmentFrom(formData),
  });
  if (!parsed.success) {
    return { error: 'Please review the content fields.' };
  }

  const visibility = resolveTrainingVisibility({
    mode: str(formData, 'visibility'),
    publishAt: str(formData, 'publishAt'),
  });
  if ('error' in visibility) {
    return { error: visibility.error };
  }

  let updated;
  try {
    updated = await prisma.trainingContent.update({
      where: { id: owned.content.id },
      data: { ...parsed.data, status: visibility.status, publishAt: visibility.publishAt },
    });
  } catch {
    return { error: 'The content could not be saved.' };
  }

  // De borrador o programado a visible: es el momento de avisar a los jugadores.
  await notifyIfNewlyVisible(owned.content, updated);
  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(authorHome(owned.author));
}

/**
 * Publica ya un contenido propio (borrador o programado) y avisa a la audiencia.
 * Es el atajo de la tarjeta cuando el autor no quiere esperar a la fecha.
 */
export async function publishTrainingContentAction(formData: FormData): Promise<void> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return;
  }

  const updated = await prisma.trainingContent.update({
    where: { id: owned.content.id },
    data: { status: 'PUBLISHED', publishAt: null },
  });

  await notifyIfNewlyVisible(owned.content, updated);
  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(authorHome(owned.author));
}

/** Devuelve el contenido propio a borrador: deja de llegar a los jugadores. */
export async function unpublishTrainingContentAction(formData: FormData): Promise<void> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return;
  }

  await prisma.trainingContent.update({
    where: { id: owned.content.id },
    data: { status: 'DRAFT', publishAt: null },
  });

  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(authorHome(owned.author));
}

/** Crea o reemplaza el quiz del contenido propio (mismo builder que el admin). */
export async function saveContentQuizAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return { error: 'Content not found.' };
  }

  const questions = parseQuizQuestions(str(formData, 'questions'));
  if (questions.length === 0) {
    return {
      error: 'Add at least one question with: Question? | correct answer | wrong answer…',
    };
  }

  try {
    await replaceContentQuiz(owned.content.id, {
      title: str(formData, 'quizTitle') ?? `${owned.content.title} — quiz`,
      passScore: parsePassScore(str(formData, 'passScore')),
      questions,
    });
  } catch {
    return { error: 'The quiz could not be saved.' };
  }

  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}

/** Quita el quiz del contenido propio (los intentos caen en cascada). */
export async function deleteContentQuizAction(formData: FormData): Promise<void> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return;
  }

  await quizDelete(owned.content.id);
  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}

// ---------------------------------------------------------------------------
// Medios del contenido (portada y vídeo)
// ---------------------------------------------------------------------------

/** Prefijo de las portadas dentro del almacén (`/uploads/training/covers/…`). */
const COVER_KEY_PREFIX = 'training/covers/';
/** Prefijo de los vídeos (`/uploads/training/videos/…`). */
const VIDEO_KEY_PREFIX = 'training/videos/';

/**
 * Valida y guarda una imagen o un vídeo del contenido con `resolveStorage()`
 * (disco local o S3). Mismos formatos y límites que el feed de Discovery.
 *
 * Nota: la miniatura automática del vídeo necesitaría `ffmpeg`, que no está en la
 * imagen de producción; por eso la portada se sube a mano.
 */
async function saveTrainingMedia(
  file: FormDataEntryValue | null,
  kind: 'cover' | 'video'
): Promise<{ url: string } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select a file.' };
  }

  const extensions = kind === 'cover' ? TRAINING_IMAGE_MIME_EXT : TRAINING_VIDEO_MIME_EXT;
  const maxBytes = kind === 'cover' ? TRAINING_IMAGE_MAX_BYTES : TRAINING_VIDEO_MAX_BYTES;
  const ext = extensions[file.type];
  if (!ext) {
    return {
      error:
        kind === 'cover'
          ? 'Only JPG, PNG or WebP images are allowed.'
          : 'Only MP4, WebM or MOV videos are allowed.',
    };
  }
  if (file.size > maxBytes) {
    return {
      error: kind === 'cover' ? 'The image must be under 4 MB.' : 'The video must be under 25 MB.',
    };
  }

  try {
    const { url } = await resolveStorage().save({
      key: `${kind === 'cover' ? COVER_KEY_PREFIX : VIDEO_KEY_PREFIX}${crypto.randomUUID()}.${ext}`,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    return { url };
  } catch {
    return { error: 'The file could not be saved.' };
  }
}

/** Sube o reemplaza la portada (`thumbnailUrl`) del contenido propio. */
export async function uploadTrainingCoverAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return { error: 'Content not found.' };
  }

  const saved = await saveTrainingMedia(formData.get('file'), 'cover');
  if ('error' in saved) {
    return saved;
  }

  try {
    await prisma.trainingContent.update({
      where: { id: owned.content.id },
      data: { thumbnailUrl: saved.url },
    });
    // La portada anterior se borra cuando la nueva ya está guardada (best-effort).
    await resolveStorage().remove(owned.content.thumbnailUrl);
  } catch {
    return { error: 'The cover could not be saved.' };
  }

  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}

/** Quita la portada del contenido propio (y el fichero del almacén). */
export async function removeTrainingCoverAction(formData: FormData): Promise<void> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return;
  }

  await prisma.trainingContent.update({
    where: { id: owned.content.id },
    data: { thumbnailUrl: null },
  });
  await resolveStorage().remove(owned.content.thumbnailUrl);
  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}

/** Sube o reemplaza el vídeo (`videoUrl`) del contenido propio. */
export async function uploadTrainingVideoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return { error: 'Content not found.' };
  }

  const saved = await saveTrainingMedia(formData.get('file'), 'video');
  if ('error' in saved) {
    return saved;
  }

  try {
    await prisma.trainingContent.update({
      where: { id: owned.content.id },
      data: { videoUrl: saved.url },
    });
    // El vídeo anterior se borra cuando el nuevo ya está guardado (best-effort).
    await resolveStorage().remove(owned.content.videoUrl);
  } catch {
    return { error: 'The video could not be saved.' };
  }

  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}

/** Quita el vídeo del contenido propio (y el fichero del almacén). */
export async function removeTrainingVideoAction(formData: FormData): Promise<void> {
  const owned = await findOwnedContent(str(formData, 'contentId') ?? '');
  if (!owned) {
    return;
  }

  await prisma.trainingContent.update({
    where: { id: owned.content.id },
    data: { videoUrl: null },
  });
  await resolveStorage().remove(owned.content.videoUrl);
  revalidatePaths(...authorPaths(owned.author, owned.content.id));
  redirect(trainingEditPath(owned.author, owned.content.id));
}
