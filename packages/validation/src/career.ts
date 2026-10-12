import { z } from 'zod';

/** Season como "2024/25" (o un year suelto tipo "2024"). */
const seasonSchema = z
  .string()
  .trim()
  .regex(/^\d{4}(\/\d{2,4})?$/, 'Usa el formato 2024/25');

/** Stats de una season (0-500). */
const statSchema = z.number().int().min(0).max(500);

export const careerEntrySchema = z.object({
  clubName: z.string().trim().min(1).max(120),
  category: z.string().trim().max(60).optional().nullable(),
  season: seasonSchema,
  appearances: statSchema.optional().nullable(),
  goals: statSchema.optional().nullable(),
  assists: statSchema.optional().nullable(),
  isCurrent: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CareerEntryInput = z.infer<typeof careerEntrySchema>;
