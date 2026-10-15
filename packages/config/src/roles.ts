/** Plural labels for the platform `Role` enum (dashboards, counts, breakdowns). */
export const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Players',
  PARENT: 'Families',
  COACH: 'Coaches',
  SCOUT: 'Scouts',
  AGENT: 'Agents',
  CLUB: 'Clubs',
  UNIVERSITY: 'Universities',
  SCHOOL: 'Schools / Community',
  ADMIN: 'Admins',
};

/**
 * Tipos de cuenta que se pueden **crear** desde el alta (por email o con Google),
 * con el texto que se muestra en los formularios. El resto de roles existen en la
 * plataforma (los asigna un admin), pero de momento no se ofrecen al registrarse.
 */
export const SIGNUP_ROLE_OPTIONS = [
  { value: 'PLAYER', label: 'Player', description: 'I am a footballer' },
  { value: 'COACH', label: 'Coach', description: 'I coach players' },
  { value: 'CLUB', label: 'Club', description: 'I represent a club' },
] as const;

export type SignupRole = (typeof SIGNUP_ROLE_OPTIONS)[number]['value'];

/** Valores permitidos, para validar en el servidor. */
export const SIGNUP_ROLES: readonly SignupRole[] = SIGNUP_ROLE_OPTIONS.map(
  (option) => option.value
);

export function isSignupRole(value: string): value is SignupRole {
  return (SIGNUP_ROLES as readonly string[]).includes(value);
}

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
