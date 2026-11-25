import { z } from 'zod';

/** Cobertura de una beca/programa. */
export const SCHOLARSHIP_COVERAGES = ['FULL', 'PARTIAL', 'BOARDING'] as const;
export type ScholarshipCoverage = (typeof SCHOLARSHIP_COVERAGES)[number];

export const SCHOLARSHIP_COVERAGE_LABELS: Record<ScholarshipCoverage, string> = {
  FULL: 'Full scholarship',
  PARTIAL: 'Partial scholarship',
  BOARDING: 'Boarding place',
};

/** Número opcional desde un `<input>`: vacío → `null` (nunca 0). */
function optionalNumber(min: number, max: number) {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().min(min).max(max).nullable()
  );
}

/** Entero opcional desde un `<input>`: vacío → `null`. */
function optionalInt(min: number, max: number) {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().int().min(min).max(max).nullable()
  );
}

/**
 * Formulario de «+ New scholarship»: crea el programa y su `Opportunity`
 * (tipo SCHOLARSHIP) para que el jugador pueda postularse con el flujo normal.
 */
export const scholarshipSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  coverage: z.enum(SCHOLARSHIP_COVERAGES),
  spots: z.coerce.number().int().min(1).max(500),
  amount: z.string().trim().max(80).optional().or(z.literal('')),
  minGpa: optionalNumber(0, 4),
  intakeYear: optionalInt(2024, 2100),
  closesAt: z.string().trim().optional().or(z.literal('')),
  position: z.string().trim().max(40).optional().or(z.literal('')),
  ageMin: optionalInt(6, 40),
  ageMax: optionalInt(6, 40),
});

export type ScholarshipInput = z.infer<typeof scholarshipSchema>;
