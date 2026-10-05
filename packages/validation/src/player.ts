import { z } from 'zod';

/** Realistic bounds for a football player's physical data and age. */
const MIN_HEIGHT_CM = 120;
const MAX_HEIGHT_CM = 220;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 150;
const MIN_AGE_YEARS = 6;
const MAX_AGE_YEARS = 70;

function ageInYears(date: Date): number {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Birth date as `YYYY-MM-DD` (or ISO prefix) that actually parses and yields a
 * realistic player age. Prevents `Invalid Date` and nonsense values downstream.
 */
const birthDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}/, 'Use the YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid date')
  .refine(
    (value) => {
      const age = ageInYears(new Date(value));
      return age >= MIN_AGE_YEARS && age <= MAX_AGE_YEARS;
    },
    `Age must be between ${MIN_AGE_YEARS} and ${MAX_AGE_YEARS}`
  );

export const playerProfileSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dateOfBirth: birthDateSchema.optional().nullable(),
  nationality: z.string().max(80).optional().nullable(),
  position: z.string().max(40).optional().nullable(),
  foot: z.string().max(20).optional().nullable(),
  heightCm: z.number().int().min(MIN_HEIGHT_CM).max(MAX_HEIGHT_CM).optional().nullable(),
  weightKg: z.number().int().min(MIN_WEIGHT_KG).max(MAX_WEIGHT_KG).optional().nullable(),
  competitionLevel: z.string().max(60).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  clubName: z.string().max(120).optional().nullable(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
