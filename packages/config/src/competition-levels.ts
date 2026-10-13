export const COMPETITION_LEVELS = ['amateur', 'regional', 'nacional', 'continental', 'internacional'] as const;

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
  amateur: 'Amateur',
  regional: 'Regional',
  nacional: 'National',
  continental: 'Continental',
  internacional: 'International',
};
export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];
