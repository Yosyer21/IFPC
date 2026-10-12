import { z } from 'zod';

/**
 * Validación del feed Discovery. Autocontenida (mismo estilo que `club.ts` o
 * `opportunity.ts`): los límites se exportan para que la UI los use sin duplicar.
 */

export const POST_BODY_MAX = 2000;
export const POST_TITLE_MAX = 120;
export const POST_COMMENT_MAX = 500;
export const POST_TAGS_MAX = 5;
export const POST_TAG_MAX = 24;
/** Motivo de una report. */
export const POST_REPORT_MAX = 300;

/** Tags: `#sub17`, `sub17` → siempre en minúsculas y sin `#` ni espacios. */
const tagSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^#+/, '').toLowerCase())
  .refine((value) => /^[a-z0-9][a-z0-9_-]*$/.test(value), 'Invalid tag')
  .refine((value) => value.length <= POST_TAG_MAX, `Maximum ${POST_TAG_MAX} characters`);

export const postBaseSchema = z.object({
  // Mismo enum que `PostType` (el precedente en `opportunitySchema` duplica los literales).
  type: z.enum(['ANNOUNCEMENT', 'VIDEO', 'PHOTO', 'ACHIEVEMENT']),
  title: z.string().trim().max(POST_TITLE_MAX).optional().nullable(),
  body: z.string().trim().max(POST_BODY_MAX).optional().nullable(),
  mediaUrl: z.string().trim().max(500).optional().nullable(),
  mediaKind: z.enum(['image', 'video', 'embed']).optional().nullable(),
  linkUrl: z.string().trim().url('Invalid URL').max(500).optional().nullable(),
  opportunityId: z.string().trim().max(40).optional().nullable(),
  tags: z.array(tagSchema).max(POST_TAGS_MAX, `Maximum ${POST_TAGS_MAX} tags`).optional(),
  /** Quién puede comentar (mismo enum que `CommentsPolicy`). */
  commentsPolicy: z.enum(['EVERYONE', 'FOLLOWERS', 'NOBODY']).optional(),
  /** Texto alternativo del medio (accesibilidad). */
  mediaAlt: z.string().trim().max(200).optional().nullable(),
  /** Fecha de post programada (ISO). */
  publishAt: z.string().optional().nullable(),
  /** Opciones de encuesta (2-4). */
  pollOptions: z.array(z.string().trim().min(1).max(80)).max(4).optional(),
});

export const postSchema = postBaseSchema.refine(
  (data) => Boolean(data.body || data.title || data.mediaUrl),
  { message: 'The post needs text or media', path: ['body'] }
);

export type PostInput = z.infer<typeof postBaseSchema>;

/** Edición del texto de una post (el medio no se toca aquí). */
export const postEditSchema = postBaseSchema
  .pick({ title: true, body: true, tags: true })
  .refine((data) => Boolean(data.body || data.title), {
    message: 'The post needs text',
    path: ['body'],
  });

export type PostEditInput = z.infer<typeof postEditSchema>;

export const postCommentSchema = z.object({
  postId: z.string().trim().min(1).max(40),
  parentId: z.string().trim().max(40).optional().nullable(),
  body: z.string().trim().min(1).max(POST_COMMENT_MAX),
});

export type PostCommentInput = z.infer<typeof postCommentSchema>;

/** Edición del texto de un comment propio. */
export const postCommentEditSchema = z.object({
  body: z.string().trim().min(1).max(POST_COMMENT_MAX),
});

export const postReportSchema = z.object({
  postId: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(3).max(POST_REPORT_MAX),
});

export type PostReportInput = z.infer<typeof postReportSchema>;
