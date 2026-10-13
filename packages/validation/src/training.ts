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
  // Ejercicio estructurado (ficha de campo): series, repeticiones, descanso,
  // material, espacio y jugadores. Todo opcional: un curso no los usa.
  series: z.number().int().min(1).max(50).optional().nullable(),
  reps: z.string().trim().max(60).optional().nullable(),
  restSeconds: z.number().int().min(0).max(3600).optional().nullable(),
  space: z.string().trim().max(60).optional().nullable(),
  players: z.string().trim().max(60).optional().nullable(),
  /**
   * Material: lista cerrada (mismas claves que `TRAINING_EQUIPMENT`), en literal
   * a propósito porque este paquete no depende de `@ifpc/config`; el test de
   * cálculo comprueba que ambas listas siguen coincidiendo.
   */
  equipment: z
    .array(
      z.enum([
        'balls',
        'cones',
        'poles',
        'bibs',
        'goals',
        'mini-goals',
        'mannequins',
        'hurdles',
        'ladder',
        'markers',
        'wall',
        'bands',
      ])
    )
    .max(12)
    .optional(),
});

export type TrainingContentInput = z.infer<typeof trainingContentSchema>;

/**
 * Sesión o plan del Football Center: agrupa ejercicios ordenados. Como en el
 * contenido, la visibilidad (`DRAFT` / `PUBLISHED` + `publishAt`) se resuelve en
 * la acción con `resolveTrainingVisibility`.
 */
export const trainingSessionSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(600).optional().nullable(),
  /** Día sugerido de la semana (0 = lunes … 6 = domingo). */
  weekday: z.number().int().min(0).max(6).optional().nullable(),
});

export type TrainingSessionInput = z.infer<typeof trainingSessionSchema>;
