import { z } from 'zod';

export const clubProfileSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  league: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export type ClubProfileInput = z.infer<typeof clubProfileSchema>;
