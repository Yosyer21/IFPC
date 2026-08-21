export const OPPORTUNITY_TYPES = ['TRIAL', 'SCOUTING', 'CONTRACT', 'SCHOLARSHIP', 'ACADEMY'] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  TRIAL: 'Prueba',
  SCOUTING: 'Scouting',
  CONTRACT: 'Contrato',
  SCHOLARSHIP: 'Beca',
  ACADEMY: 'Academia',
};
