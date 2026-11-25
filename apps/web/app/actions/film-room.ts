'use server';

import { auth } from '@ifpc/auth';
import { POST_VIDEO_MAX_BYTES, POST_VIDEO_MIME_EXT } from '@ifpc/config';
import { prisma } from '@ifpc/database';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import { resolveStorage } from '@/lib/storage';
import {
  FILM_CLIP_CATEGORIES,
  formatTimestamp,
  parseTimestamp,
  type FilmClipCategoryValue,
} from '@/lib/film-room';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/** Guarda el vídeo del clip en el almacén (disco local o S3). */
async function storeVideo(
  file: FormDataEntryValue | null
): Promise<{ url: string } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: 'Select a video.' };
  const ext = POST_VIDEO_MIME_EXT[file.type];
  if (!ext) return { error: 'Only MP4, WebM or MOV videos are allowed.' };
  if (file.size > POST_VIDEO_MAX_BYTES) {
    return {
      error: `The video must be under ${Math.round(POST_VIDEO_MAX_BYTES / 1024 / 1024)} MB.`,
    };
  }
  try {
    const { url } = await resolveStorage().save({
      key: `film-room/${crypto.randomUUID()}.${ext}`,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    return { url };
  } catch {
    return { error: 'The video could not be saved.' };
  }
}

/**
 * Film Room · El jugador sube un clip: se guarda el vídeo, se crea una
 * publicación en Discovery (red social) y el clip queda vinculado a ella.
 */
export async function createFilmClipAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'PLAYER') {
    return { error: 'Only players can upload clips.' };
  }
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true, firstName: true },
  });
  if (!player) return { error: 'Player profile not found.' };

  const title = str(formData, 'title');
  const category = str(formData, 'category');
  const question = str(formData, 'question');
  if (!title) return { error: 'Add a title for the clip.' };
  if (!category || !(FILM_CLIP_CATEGORIES as readonly string[]).includes(category)) {
    return { error: 'Choose a category.' };
  }

  const saved = await storeVideo(formData.get('video'));
  if ('error' in saved) return saved;

  try {
    await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: session.user.id,
          type: 'VIDEO',
          status: 'PUBLISHED',
          title,
          body: question ?? null,
          mediaUrl: saved.url,
          mediaKind: 'video',
          tags: ['filmroom', category.toLowerCase()],
        },
      });
      await tx.filmClip.create({
        data: {
          playerId: player.id,
          postId: post.id,
          title,
          category: category as FilmClipCategoryValue,
          question: question ?? null,
          videoUrl: saved.url,
        },
      });
    });
  } catch {
    return { error: 'Could not upload the clip.' };
  }

  // Avisar a los entrenadores del jugador.
  try {
    const coaches = await prisma.coachPlayer.findMany({
      where: { playerId: player.id },
      select: { coach: { select: { userId: true } } },
    });
    for (const link of coaches) {
      await notifyUser({
        userId: link.coach.userId,
        type: 'application',
        title: 'New Film Room clip',
        message: `${player.firstName} uploaded "${title}".`,
        link: '/dashboard/coach/film-room',
      });
    }
  } catch {
    // El clip ya está publicado; un fallo del aviso no lo deshace.
  }

  revalidatePaths('/dashboard/player/film-room', '/dashboard/coach/film-room', '/dashboard/discovery');
  return { success: 'Clip published to the Film Room and Discovery.' };
}

/**
 * Film Room · El entrenador añade una nota con marca de tiempo. La nota también
 * se publica como comentario en el post de Discovery del clip.
 */
export async function addFilmClipNoteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return { error: 'Only coaches can add feedback.' };
  }
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return { error: 'Coach profile not found.' };

  const clipId = str(formData, 'clipId');
  const body = str(formData, 'body');
  const timestampRaw = str(formData, 'timestamp') ?? '';
  if (!clipId || !body) return { error: 'Write your feedback.' };
  const seconds = parseTimestamp(timestampRaw);
  if (seconds === null) return { error: 'Use a timestamp like 1:05.' };

  const clip = await prisma.filmClip.findFirst({
    where: { id: clipId, player: { coaches: { some: { coachId: coach.id } } } },
    include: {
      post: { select: { id: true } },
      player: { select: { userId: true, firstName: true } },
    },
  });
  if (!clip) return { error: 'Clip not found.' };

  const comment = `${formatTimestamp(seconds)} — ${body}`;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.filmClipNote.create({
        data: { clipId: clip.id, authorUserId: session.user.id, timestampSeconds: seconds, body },
      });
      await tx.postComment.create({
        data: { postId: clip.post.id, authorId: session.user.id, body: comment },
      });
      await tx.filmClip.update({ where: { id: clip.id }, data: { status: 'REVIEWED' } });
    });
  } catch {
    return { error: 'Could not save the feedback.' };
  }

  try {
    await notifyUser({
      userId: clip.player.userId,
      type: 'application',
      title: 'Coach feedback on your clip',
      message: `Your coach left a note at ${formatTimestamp(seconds)} on "${clip.title}".`,
      link: '/dashboard/player/film-room',
    });
  } catch {
    // best-effort
  }

  revalidatePaths(
    '/dashboard/player/film-room',
    '/dashboard/coach/film-room',
    `/dashboard/discovery/${clip.post.id}`
  );
  return { success: 'Feedback sent. It also appears in Discovery.' };
}
