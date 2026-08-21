export interface MatchCriteria {
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  competitionLevel?: string | null;
  country?: string | null;
}

export interface MatchResult {
  playerId: string;
  clubId?: string | null;
  opportunityId?: string | null;
  score: number; // 0-100
  explanation: string;
  matchedAt: Date;
}
