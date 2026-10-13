import { z } from 'zod';

/**
 * Contenido del Football Center que publica un coach o un club. Las listas de
 * `kind` y `category` se declaran aquí en literal a propósito (este paquete no
 * depende de `@ifpc/config`); `tests/unit/calculations/training.test.ts` comprueba
 * que siguen coincidiendo con `TRAINING_KINDS` / `TRAINING_CATEGORIES`.
 */
export const trainingContentSchema = z.object({
  kind: z.enum(['COURSE', 'EXERCISE']),
  category: z.enum(['technical', 'strength-conditioning', 'psychology', 'parent-education']),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(600).optional().nullable(),
  content: z.string().trim().max(20000).optional().nullable(),
  outcomes: z.array(z.string().trim().min(1).max(200)).max(12).optional(),
  videoUrl: z.string().trim().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
});

export type TrainingContentInput = z.infer<typeof trainingContentSchema>;
