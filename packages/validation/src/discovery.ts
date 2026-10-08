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
/** Motivo de una denuncia. */
export const POST_REPORT_MAX = 300;

/** Etiquetas: `#sub17`, `sub17` → siempre en minúsculas y sin `#` ni espacios. */
const tagSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^#+/, '').toLowerCase())
  .refine((value) => /^[a-z0-9][a-z0-9_-]*$/.test(value), 'Etiqueta no válida')
  .refine((value) => value.length <= POST_TAG_MAX, `Máximo ${POST_TAG_MAX} caracteres`);

export const postBaseSchema = z.object({
  // Mismo enum que `PostType` (el precedente en `opportunitySchema` duplica los literales).
  type: z.enum(['ANNOUNCEMENT', 'VIDEO', 'PHOTO', 'ACHIEVEMENT']),
  title: z.string().trim().max(POST_TITLE_MAX).optional().nullable(),
  body: z.string().trim().max(POST_BODY_MAX).optional().nullable(),
  mediaUrl: z.string().trim().max(500).optional().nullable(),
  mediaKind: z.enum(['image', 'video', 'embed']).optional().nullable(),
  linkUrl: z.string().trim().url('URL no válida').max(500).optional().nullable(),
  opportunityId: z.string().trim().max(40).optional().nullable(),
  tags: z.array(tagSchema).max(POST_TAGS_MAX, `Máximo ${POST_TAGS_MAX} etiquetas`).optional(),
});

export const postSchema = postBaseSchema.refine(
  (data) => Boolean(data.body || data.title || data.mediaUrl),
  { message: 'La publicación necesita texto o contenido multimedia', path: ['body'] }
);

export type PostInput = z.infer<typeof postBaseSchema>;

/** Edición del texto de una publicación (el medio no se toca aquí). */
export const postEditSchema = postBaseSchema
  .pick({ title: true, body: true, tags: true })
  .refine((data) => Boolean(data.body || data.title), {
    message: 'La publicación necesita texto',
    path: ['body'],
  });

export type PostEditInput = z.infer<typeof postEditSchema>;

export const postCommentSchema = z.object({
  postId: z.string().trim().min(1).max(40),
  parentId: z.string().trim().max(40).optional().nullable(),
  body: z.string().trim().min(1).max(POST_COMMENT_MAX),
});

export type PostCommentInput = z.infer<typeof postCommentSchema>;

/** Edición del texto de un comentario propio. */
export const postCommentEditSchema = z.object({
  body: z.string().trim().min(1).max(POST_COMMENT_MAX),
});

export const postReportSchema = z.object({
  postId: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(3).max(POST_REPORT_MAX),
});

export type PostReportInput = z.infer<typeof postReportSchema>;
