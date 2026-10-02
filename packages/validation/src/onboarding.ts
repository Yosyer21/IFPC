import { z } from 'zod';

export const parentOnboardingSchema = z.object({});

export const coachOnboardingSchema = z.object({
  clubName: z.string().max(120).optional().nullable(),
});

export const agentOnboardingSchema = z.object({
  agency: z.string().max(120).optional().nullable(),
  license: z.string().max(120).optional().nullable(),
});

export const clubOnboardingSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  league: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const scoutOnboardingSchema = z.object({
  agency: z.string().max(120).optional().nullable(),
});

export const universityOnboardingSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const schoolOnboardingSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['SCHOOL', 'COMMUNITY_SERVICE']).optional().nullable(),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  contactName: z.string().max(120).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export type ParentOnboardingInput = z.infer<typeof parentOnboardingSchema>;
export type CoachOnboardingInput = z.infer<typeof coachOnboardingSchema>;
export type AgentOnboardingInput = z.infer<typeof agentOnboardingSchema>;
export type ClubOnboardingInput = z.infer<typeof clubOnboardingSchema>;
export type ScoutOnboardingInput = z.infer<typeof scoutOnboardingSchema>;
export type UniversityOnboardingInput = z.infer<typeof universityOnboardingSchema>;
export type SchoolOnboardingInput = z.infer<typeof schoolOnboardingSchema>;
