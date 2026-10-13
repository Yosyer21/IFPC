export type TrainingCategory =
  | 'technical'
  | 'strength-conditioning'
  | 'psychology'
  | 'parent-education';

/** Curso (lectura + quiz) o ejercicio (para hacer). */
export type TrainingKind = 'COURSE' | 'EXERCISE';

/** Quién publica el contenido: la plataforma, un coach o un club. */
export type TrainingOrigin = 'GENERAL' | 'COACH' | 'CLUB';

export interface TrainingContent {
  id: string;
  title: string;
  category: string;
  kind: TrainingKind;
  ownerType: TrainingOrigin;
  /** Coach autor (cuando `ownerType` es `COACH`). */
  coachId?: string | null;
  /** Club autor (cuando `ownerType` es `CLUB`). */
  clubId?: string | null;
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

/** Progreso de un jugador sobre un curso o ejercicio. */
export interface TrainingProgress {
  id: string;
  playerId: string;
  contentId: string;
  /** `null` mientras no lo haya completado. */
  completedAt?: Date | null;
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

