export type RecruitmentStage = 'SUBMISSION' | 'TRIAL' | 'NEGOTIATION' | 'CONTRACT';

export interface Submission {
  id: string;
  playerId: string;
  clubId: string;
  stage: RecruitmentStage;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trial {
  id: string;
  submissionId?: string | null;
  clubId: string;
  playerId: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Negotiation {
  id: string;
  submissionId?: string | null;
  clubId: string;
  playerId: string;
  status: string;
  offerAmount?: number | null;
  currency?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  negotiationId?: string | null;
  clubId: string;
  playerId: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: string;
  signedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
