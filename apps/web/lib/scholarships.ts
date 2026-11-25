import { SCHOLARSHIP_COVERAGE_LABELS } from '@ifpc/validation';

/** Destello de color por cobertura (misma paleta que el resto de etiquetas). */
export const SCHOLARSHIP_COVERAGE_TONE: Record<string, string> = {
  FULL: 'fb-tag-lime',
  PARTIAL: 'fb-tag-blue',
  BOARDING: 'fb-tag-amber',
};

export interface ScholarshipLike {
  coverage: string;
  spots: number;
  amount?: string | null;
  minGpa?: number | null;
  intakeYear?: number | null;
}

/** Etiqueta legible de la cobertura (nunca lanza). */
export function scholarshipCoverageLabel(coverage: string): string {
  return (
    (SCHOLARSHIP_COVERAGE_LABELS as Record<string, string | undefined>)[coverage] ?? coverage
  );
}

/** Resumen de una línea: «Full scholarship · 2 spots · 100% tuition · Intake 2027». */
export function scholarshipSummary(scholarship: ScholarshipLike | null | undefined): string | null {
  if (!scholarship) return null;
  const parts = [
    scholarshipCoverageLabel(scholarship.coverage),
    `${scholarship.spots} spot${scholarship.spots === 1 ? '' : 's'}`,
  ];
  if (scholarship.amount) parts.push(scholarship.amount);
  if (scholarship.intakeYear) parts.push(`Intake ${scholarship.intakeYear}`);
  return parts.join(' · ');
}
