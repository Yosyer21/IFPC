import { z } from 'zod';

export const applicationSchema = z.object({
  opportunityId: z.string().cuid(),
  message: z.string().max(2000).optional().nullable(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
