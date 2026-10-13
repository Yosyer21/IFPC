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
  /** Personalización del perfil (ver `packages/config/src/club-profile.ts`). */
  headline?: string | null;
  foundedYear?: number | null;
  tags: string[];
  accentColor?: string | null;
  bannerUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
