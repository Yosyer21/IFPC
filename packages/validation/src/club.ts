import { z } from 'zod';

/** Año actual: acota `foundedYear` (un club no se funda en el futuro). */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Perfil del club. El acento (`accentColor`) y los chips (`tags`) se normalizan
 * en la acción contra `@ifpc/config` (`resolveProfileAccent`,
 * `sanitizeClubProfileTags`), igual que hace el perfil del player.
 */
export const clubProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2),
  city: z.string().trim().max(120).optional().nullable(),
  league: z.string().trim().max(120).optional().nullable(),
  foundedYear: z.number().int().min(1850).max(CURRENT_YEAR).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  headline: z.string().trim().max(120).optional().nullable(),
  accentColor: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type ClubProfileInput = z.infer<typeof clubProfileSchema>;
