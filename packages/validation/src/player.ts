import { z } from 'zod';

export const playerProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  foot: z.string().optional().nullable(),
  heightCm: z.number().int().positive().optional().nullable(),
  weightKg: z.number().int().positive().optional().nullable(),
  competitionLevel: z.string().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  clubName: z.string().optional().nullable(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
