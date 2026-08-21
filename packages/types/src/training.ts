export type TrainingCategory = 'technical' | 'strength-conditioning' | 'psychology';

export interface TrainingContent {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  difficulty?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
