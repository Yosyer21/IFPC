/**
 * Reglas de protección de jugadores menores de 16 años (libro §2). Se aplican en
 * SERVIDOR: visibilidad del ID, consentimiento parental e invitaciones directas.
 * Helpers puros (sin Prisma) para poder testearlos y reutilizarlos en queries.
 */

export const MINOR_AGE = 16;
export const ADULT_AGE = 18;

/** Visibilidad por defecto según el lienzo: 3 activadas, invitaciones directas off. */
export const DEFAULT_MINOR_VISIBILITY = {
  idVisibleToClubs: true,
  idVisibleToSchools: true,
  showStatsAndClips: true,
  allowDirectInvites: false,
} as const;

/** Edad cumplida (UTC) a partir de la fecha de nacimiento. */
export function ageOn(dateOfBirth: Date | null | undefined, now: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** `true` si el jugador tiene menos de 16 años (edad desconocida => false). */
export function isUnder16(dateOfBirth: Date | null | undefined, now: Date = new Date()): boolean {
  const age = ageOn(dateOfBirth, now);
  return age !== null && age < MINOR_AGE;
}

/** `true` si el jugador es menor de edad (<18). */
export function isMinor(dateOfBirth: Date | null | undefined, now: Date = new Date()): boolean {
  const age = ageOn(dateOfBirth, now);
  return age !== null && age < ADULT_AGE;
}

function anyLinkAllows<T extends Record<K, boolean>, K extends string>(
  dateOfBirth: Date | null | undefined,
  links: T[] | null | undefined,
  key: K,
  now: Date
): boolean {
  // Solo restringe a menores de 16; el resto siempre visible.
  if (!isUnder16(dateOfBirth, now)) return true;
  // Sin padre vinculado no se bloquea aquí (se valida al vincular/consentir).
  if (!links || links.length === 0) return true;
  return links.some((link) => link[key]);
}

/** ¿Puede un club verificado ver el ID del jugador? (menores de 16). */
export function isVisibleToClubs(
  dateOfBirth: Date | null | undefined,
  links: { idVisibleToClubs: boolean }[] | null | undefined,
  now: Date = new Date()
): boolean {
  return anyLinkAllows(dateOfBirth, links, 'idVisibleToClubs', now);
}

/** ¿Puede un colegio verificado ver el ID del jugador? (menores de 16). */
export function isVisibleToSchools(
  dateOfBirth: Date | null | undefined,
  links: { idVisibleToSchools: boolean }[] | null | undefined,
  now: Date = new Date()
): boolean {
  return anyLinkAllows(dateOfBirth, links, 'idVisibleToSchools', now);
}

/** ¿Se pueden mostrar estadísticas y clips? (menores de 16). */
export function canShowStatsAndClips(
  dateOfBirth: Date | null | undefined,
  links: { showStatsAndClips: boolean }[] | null | undefined,
  now: Date = new Date()
): boolean {
  return anyLinkAllows(dateOfBirth, links, 'showStatsAndClips', now);
}

/**
 * ¿La oferta/prueba necesita aprobación del padre antes de contar? (libro §2:
 * toda oferta a un menor de 16 pasa primero por el padre). Sin padre vinculado
 * no hay a quién pedirla: se deja pasar y se valida al vincular.
 */
export function needsParentApproval(
  dateOfBirth: Date | null | undefined,
  parentLinks: readonly unknown[] | null | undefined,
  now: Date = new Date()
): boolean {
  return isUnder16(dateOfBirth, now) && Boolean(parentLinks && parentLinks.length > 0);
}
