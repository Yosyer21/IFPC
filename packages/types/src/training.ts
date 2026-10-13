export type TrainingCategory = 'technical' | 'strength-conditioning' | 'psychology' | 'parent-education';

export interface TrainingContent {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  /** Cuerpo del curso (texto plano con saltos de línea). */
  content?: string | null;
  /** Puntos clave / resultados de aprendizaje. */
  outcomes?: string[];
  videoUrl?: string | null;
  durationMinutes?: number | null;
  difficulty?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizOption {
  id: string;
  label: string;
  position: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  explanation?: string | null;
  position: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  contentId: string;
  title: string;
  description?: string | null;
  /** Porcentaje mínimo para aprobar (0-100). */
  passScore: number;
  questions: QuizQuestion[];
}

