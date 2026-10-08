'use server';

import { redirect } from 'next/navigation';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auth } from '@ifpc/auth';
import {
  POSTING_ROLES,
  POST_IMAGE_MAX_BYTES,
  POST_IMAGE_MIME_EXT,
  POST_VIDEO_MAX_BYTES,
  POST_VIDEO_MIME_EXT,
} from '@ifpc/config';
import { prisma } from '@ifpc/database';
import {
  postCommentSchema,
  postEditSchema,
  postReportSchema,
  postSchema,
} from '@ifpc/validation';
import { extractTags, resolveEmbed } from '@/lib/discovery';
import { notifyUser } from '@/lib/notifications/notify';
import { dashboardPath } from '@/lib/safe-redirect';
import type { ActionState } from './auth';

/** Directorio de los medios subidos al feed dentro de `public/uploads`. */
const MEDIA_DIR = path.join(process.cwd(), 'public', 'uploads', 'posts');
/** Prefijo de las URLs locales (el resto son enlaces externos incrustados). */
const MEDIA_PREFIX = '/uploads/posts/';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/** ¿El usuario autenticado tiene permiso de publicación? */
async function requirePoster(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !POSTING_ROLES.some((role) => role === user.role)) return null;
  return { id: user.id, role: user.role };
}

/** Borra el medio local de un post (best-effort, nunca lanza). */
async function removeLocalMedia(url: string | null): Promise<void> {
  if (!url?.startsWith(MEDIA_PREFIX)) return;
  try {
    await unlink(path.join(process.cwd(), 'public', url.replace(/^\//, '')));
  } catch {
    // El fichero ya no está: nada que limpiar.
  }
}

/**
 * Guarda la imagen/vídeo subido y devuelve su URL pública y su tipo, o un error
 * si el fichero no es válido.
 */
async function storeUpload(
  file: FormDataEntryValue | null
): Promise<{ mediaUrl: string; mediaKind: 'image' | 'video' } | { error: string }> {
  const imageExt = file instanceof File ? POST_IMAGE_MIME_EXT[file.type] : undefined;
  const videoExt = file instanceof File ? POST_VIDEO_MIME_EXT[file.type] : undefined;

  if (!imageExt && !videoExt) {
    return { error: 'Only JPG, PNG, WebP images or MP4/WebM/MOV videos are allowed.' };
  }
  const max = imageExt ? POST_IMAGE_MAX_BYTES : POST_VIDEO_MAX_BYTES;
  if (file instanceof File && file.size > max) {
    return { error: `El archivo supera el máximo de ${Math.round(max / 1024 / 1024)} MB.` };
  }

  try {
    await mkdir(MEDIA_DIR, { recursive: true });
    const filename = `${crypto.randomUUID()}.${imageExt ?? videoExt}`;
    const target = file as File;
    await writeFile(path.join(MEDIA_DIR, filename), Buffer.from(await target.arrayBuffer()));
    return { mediaUrl: `${MEDIA_PREFIX}${filename}`, mediaKind: imageExt ? 'image' : 'video' };
  } catch {
    return { error: 'No se pudo guardar el archivo.' };
  }
}

/** Etiquetas del formulario: separadas por espacios o comas (con o sin `#`). */
const splitTags = (value: string | null): string[] =>
  (value ?? '').split(/[\s,]+/).filter(Boolean);

/**
 * Publica en el feed. Acepta texto, una imagen/vídeo subido o un vídeo externo
 * (YouTube/Vimeo) y, opcionalmente, comparte una oportunidad existente.
 */
export async function createPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const poster = await requirePoster();
  if (!poster) {
    return { error: 'Tu perfil no puede publicar.' };
  }

  const file = formData.get('file');
  const hasFile = file instanceof File && file.size > 0;
  const externalUrl = str(formData, 'mediaUrl');

  const parsed = postSchema.safeParse({
    type: str(formData, 'type') ?? 'ANNOUNCEMENT',
    title: str(formData, 'title'),
    body: str(formData, 'body'),
    linkUrl: str(formData, 'linkUrl'),
    opportunityId: str(formData, 'opportunityId'),
    tags: extractTags(str(formData, 'body'), splitTags(str(formData, 'tags'))),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa el contenido.' };
  }

  let mediaUrl: string | null = null;
  let mediaKind: string | null = null;
  if (hasFile) {
    const stored = await storeUpload(file);
    if ('error' in stored) return { error: stored.error };
    mediaUrl = stored.mediaUrl;
    mediaKind = stored.mediaKind;
  } else if (externalUrl) {
    const embed = resolveEmbed(externalUrl);
    if (!embed) {
      return { error: 'Only YouTube or Vimeo links can be embedded.' };
    }
    mediaUrl = embed;
    mediaKind = 'embed';
  }

  if (!mediaKind && (parsed.data.type === 'VIDEO' || parsed.data.type === 'PHOTO')) {
    return { error: 'Attach the file or the link of the media.' };
  }

  // El medio manda: un vídeo o una imagen nunca queda clasificado como anuncio.
  const type = mediaKind === 'image' ? 'PHOTO' : mediaKind ? 'VIDEO' : parsed.data.type;

  // Solo se adjunta la oportunidad si existe (el FK no admite referencias sueltas).
  const opportunityId = parsed.data.opportunityId
    ? ((
        await prisma.opportunity.findUnique({
          where: { id: parsed.data.opportunityId },
          select: { id: true },
        })
      )?.id ?? null)
    : null;

  try {
    await prisma.post.create({
      data: {
        authorId: poster.id,
        type,
        title: parsed.data.title || null,
        body: parsed.data.body || null,
        mediaUrl,
        mediaKind,
        linkUrl: parsed.data.linkUrl || null,
        opportunityId,
        tags: parsed.data.tags ?? [],
      },
    });
  } catch {
    return { error: 'No se pudo publicar.' };
  }

  redirect('/dashboard/discovery');
}

/** Edita el texto de una publicación propia (el medio no se cambia). */
export async function updatePostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const poster = await requirePoster();
  if (!poster) {
    return { error: 'Tu perfil no puede publicar.' };
  }

  const postId = str(formData, 'postId');
  if (!postId) {
    return { error: 'Publication not found.' };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) {
    return { error: 'Publication not found.' };
  }
  if (post.authorId !== poster.id) {
    return { error: 'You can only edit your own posts.' };
  }

  const parsed = postEditSchema.safeParse({
    title: str(formData, 'title'),
    body: str(formData, 'body'),
    tags: extractTags(str(formData, 'body'), splitTags(str(formData, 'tags'))),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa el contenido.' };
  }

  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        title: parsed.data.title || null,
        body: parsed.data.body || null,
        tags: parsed.data.tags ?? [],
      },
    });
  } catch {
    return { error: 'No se pudo guardar la publicación.' };
  }

  redirect(`/dashboard/discovery/${postId}`);
}

/** Borra una publicación propia (un admin puede borrar cualquiera). */
export async function deletePostAction(formData: FormData): Promise<void> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return;
  }

  const postId = str(formData, 'postId');
  if (!postId) {
    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, mediaUrl: true },
  });
  if (!post || (post.authorId !== user.id && user.role !== 'ADMIN')) {
    return;
  }

  await prisma.post.delete({ where: { id: postId } });
  await removeLocalMedia(post.mediaUrl);

  redirect(dashboardPath(formData.get('redirectTo')));
}

/** Alterna el "me gusta" y avisa al autor cuando se añade (nunca al quitar). */
export async function toggleLikeAction(formData: FormData): Promise<void> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return;
  }

  const postId = str(formData, 'postId');
  if (!postId) {
    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, status: true },
  });
  if (!post || post.status !== 'PUBLISHED') {
    return;
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId, userId: user.id } });
    if (post.authorId !== user.id) {
      try {
        await notifyUser({
          userId: post.authorId,
          type: 'post_like',
          title: 'New like',
          message: `${user.name} liked your post.`,
          link: `/dashboard/discovery/${postId}`,
        });
      } catch {
        // El aviso nunca debe romper la interacción.
      }
    }
  }
}

/** Comenta una publicación y avisa al autor. */
export async function createCommentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const parsed = postCommentSchema.safeParse({
    postId: str(formData, 'postId'),
    parentId: str(formData, 'parentId'),
    body: str(formData, 'body'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa el comentario.' };
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { authorId: true, status: true },
  });
  if (!post || post.status !== 'PUBLISHED') {
    return { error: 'Publication not found.' };
  }

  try {
    await prisma.postComment.create({
      data: {
        postId: parsed.data.postId,
        authorId: session.user.id,
        parentId: parsed.data.parentId || null,
        body: parsed.data.body,
      },
    });
  } catch {
    return { error: 'No se pudo enviar el comentario.' };
  }

  if (post.authorId !== session.user.id) {
    try {
      await notifyUser({
        userId: post.authorId,
        type: 'post_comment',
        title: 'New comment',
        message: `${session.user.name} commented on your post.`,
        link: `/dashboard/discovery/${parsed.data.postId}`,
      });
    } catch {
      // El aviso nunca debe romper el comentario.
    }
  }

  return { success: 'Comment published.' };
}

/** Borra un comentario propio (o cualquiera si eres el autor del post / admin). */
export async function deleteCommentAction(formData: FormData): Promise<void> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return;
  }

  const commentId = str(formData, 'commentId');
  if (!commentId) {
    return;
  }

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, post: { select: { authorId: true } } },
  });
  if (!comment) {
    return;
  }

  const allowed =
    comment.authorId === user.id || comment.post.authorId === user.id || user.role === 'ADMIN';
  if (!allowed) {
    return;
  }

  await prisma.postComment.delete({ where: { id: commentId } });
}

/** Denuncia una publicación (idempotente: una denuncia por persona). */
export async function reportPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }

  const parsed = postReportSchema.safeParse({
    postId: str(formData, 'postId'),
    reason: str(formData, 'reason'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Indica el motivo.' };
  }

  try {
    await prisma.postReport.upsert({
      where: {
        postId_reporterId: { postId: parsed.data.postId, reporterId: session.user.id },
      },
      update: { reason: parsed.data.reason },
      create: {
        postId: parsed.data.postId,
        reporterId: session.user.id,
        reason: parsed.data.reason,
      },
    });
  } catch {
    return { error: 'No se pudo enviar la denuncia.' };
  }

  return { success: 'Thanks, our team will review it.' };
}

/** Oculta o vuelve a publicar contenido (solo ADMIN). */
export async function moderatePostAction(formData: FormData): Promise<void> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'ADMIN') {
    return;
  }

  const postId = str(formData, 'postId');
  const status = str(formData, 'status');
  if (!postId || (status !== 'PUBLISHED' && status !== 'HIDDEN')) {
    return;
  }

  await prisma.post.update({ where: { id: postId }, data: { status } });
}

/**
 * Sigue o deja de seguir a un perfil (cualquier rol puede seguir a cualquier
 * otro). Nunca se puede seguir a uno mismo y avisa al seguido la primera vez.
 */
export async function toggleFollowAction(formData: FormData): Promise<void> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return;
  }

  const targetId = str(formData, 'userId');
  if (!targetId || targetId === user.id) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) {
    return;
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return;
  }

  await prisma.follow.create({ data: { followerId: user.id, followingId: targetId } });

  try {
    await notifyUser({
      userId: targetId,
      type: 'new_follower',
      title: 'Nuevo seguidor',
      message: `${user.name} te sigue en Discovery.`,
      link: `/dashboard/discovery/u/${user.id}`,
    });
  } catch {
    // El aviso nunca debe romper el seguimiento.
  }
}
