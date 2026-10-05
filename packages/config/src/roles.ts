/** Plural labels for the platform `Role` enum (dashboards, counts, breakdowns). */
export const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Jugadores',
  PARENT: 'Familiares',
  COACH: 'Entrenadores',
  SCOUT: 'Ojeadores',
  AGENT: 'Agentes',
  CLUB: 'Clubes',
  UNIVERSITY: 'Universidades',
  SCHOOL: 'Escuelas / Comunidad',
  ADMIN: 'Admins',
};

/**
 * Roles whose visits count as professional interest in a player profile.
 * Players, families and platform staff are excluded from the metric.
 */
export const PROFILE_VIEWER_ROLES = [
  'CLUB',
  'SCOUT',
  'AGENT',
  'UNIVERSITY',
  'SCHOOL',
  'COACH',
] as const;
