export const RECRUITMENT_STAGES = ['SUBMISSION', 'TRIAL', 'NEGOTIATION', 'CONTRACT'] as const;
export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

export const RECRUITMENT_STAGE_LABELS: Record<RecruitmentStage, string> = {
  SUBMISSION: 'Submission',
  TRIAL: 'Prueba',
  NEGOTIATION: 'Negotiation',
  CONTRACT: 'Contrato',
};
