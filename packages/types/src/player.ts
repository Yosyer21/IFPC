export type PlayerStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'AVAILABLE' | 'INACTIVE';

export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  position?: string | null;
  foot?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  status: PlayerStatus;
  competitionLevel?: string | null;
  bio?: string | null;
  clubName?: string | null;
  /** Personalización del perfil (ver `packages/config/src/profile.ts`). */
  headline?: string | null;
  location?: string | null;
  openTo?: string[];
  accentColor?: string | null;
  bannerUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
