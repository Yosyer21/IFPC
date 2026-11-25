import { z } from 'zod';

/** Disciplinas que cubre el rol unificado HEALTH_AGENT. */
export const HEALTH_AGENT_SPECIALTIES = ['NUTRITION', 'PSYCHOLOGY', 'PHYSIOTHERAPY'] as const;
export type HealthAgentSpecialtyValue = (typeof HEALTH_AGENT_SPECIALTIES)[number];

/** Formato de las sesiones de la práctica. */
export const HEALTH_AGENT_FORMATS = ['IN_PERSON', 'ONLINE', 'BOTH'] as const;
export type HealthAgentFormatValue = (typeof HEALTH_AGENT_FORMATS)[number];

/** Monedas admitidas para "price from". */
export const HEALTH_AGENT_CURRENCIES = ['EUR', 'USD', 'GBP', 'AUD'] as const;

/**
 * Perfil de la práctica de un Health Agent (nutrición, psicología o fisio).
 * Los campos opcionales aceptan `null` porque el formulario puede enviarlos vacíos.
 */
export const healthAgentProfileSchema = z.object({
  practiceName: z.string().trim().min(2).max(120),
  headline: z.string().trim().max(140).optional().nullable(),
  about: z.string().trim().max(3000).optional().nullable(),
  specialties: z.array(z.enum(HEALTH_AGENT_SPECIALTIES)).min(1).max(3),
  services: z.array(z.string().trim().min(1).max(60)).max(12),
  approach: z.array(z.string().trim().min(1).max(60)).max(12),
  registrationNumber: z.string().trim().max(80).optional().nullable(),
  insuranceProvider: z.string().trim().max(80).optional().nullable(),
  insuranceExpiresAt: z.string().trim().optional().nullable(),
  priceFrom: z.number().int().min(0).max(10000).optional().nullable(),
  currency: z.string().trim().min(3).max(3).default('EUR'),
  format: z.enum(HEALTH_AGENT_FORMATS).default('BOTH'),
  sessionsOnline: z.boolean().default(true),
  languages: z.array(z.string().trim().min(1).max(40)).max(12),
  city: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  website: z
    .union([z.string().trim().url().max(200), z.literal('')])
    .optional()
    .nullable(),
  yearsExperience: z.number().int().min(0).max(70).optional().nullable(),
  clientsServed: z.number().int().min(0).max(100000).optional().nullable(),
  availabilityNote: z.string().trim().max(300).optional().nullable(),
});

export type HealthAgentProfileInput = z.infer<typeof healthAgentProfileSchema>;
