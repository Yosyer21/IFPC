export interface Club {
  id: string;
  userId?: string | null;
  email: string;
  name: string;
  country: string;
  city?: string | null;
  league?: string | null;
  logoUrl?: string | null;
  verified: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
