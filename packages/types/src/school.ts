export const SCHOOL_TYPES = ['SCHOOL', 'COMMUNITY_SERVICE'] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export interface School {
  id: string;
  userId: string;
  name: string;
  type: SchoolType;
  country: string;
  city?: string | null;
  contactName?: string | null;
  website?: string | null;
  description?: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
