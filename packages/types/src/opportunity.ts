export type OpportunityType = 'TRIAL' | 'SCOUTING' | 'CONTRACT' | 'SCHOLARSHIP' | 'ACADEMY';
export type OpportunityStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Opportunity {
  id: string;
  clubId: string | null;
  universityId?: string | null;
  creatorType?: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  location?: string | null;
  description?: string | null;
  closesAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  playerId: string;
  opportunityId: string;
  status: ApplicationStatus;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
