import { z } from 'zod';

export const opportunitySchema = z.object({
  title: z.string().min(3),
  type: z.enum(['TRIAL', 'SCOUTING', 'CONTRACT', 'SCHOLARSHIP', 'ACADEMY']),
  position: z.string().optional().nullable(),
  ageMin: z.number().int().min(6).max(40).optional().nullable(),
  ageMax: z.number().int().min(6).max(40).optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
});

export type OpportunityInput = z.infer<typeof opportunitySchema>;
