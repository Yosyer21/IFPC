/**
 * Verificación y safeguarding (libro §2). Insignias e idoneidad para contactar
 * con jugadores. Datos gestionados por el admin; aquí solo se interpretan.
 */

export interface VerificationFlags {
  verified?: boolean | null;
  backgroundChecked?: boolean | null;
  safeguardingPolicy?: boolean | null;
  safeguardingCertified?: boolean | null;
}

export const VERIFICATION_LABELS = {
  verified: 'Verified',
  backgroundChecked: 'Background checked',
  safeguardingPolicy: 'Safeguarding policy',
  safeguardingCertified: 'Safeguarding certified',
} as const;

/** Insignias legibles a partir de los flags (solo las activas). */
export function verificationBadges(flags: VerificationFlags): string[] {
  const badges: string[] = [];
  if (flags.verified) badges.push(VERIFICATION_LABELS.verified);
  if (flags.backgroundChecked) badges.push(VERIFICATION_LABELS.backgroundChecked);
  if (flags.safeguardingPolicy) badges.push(VERIFICATION_LABELS.safeguardingPolicy);
  if (flags.safeguardingCertified) badges.push(VERIFICATION_LABELS.safeguardingCertified);
  return badges;
}

/**
 * El personal de un club solo puede contactar con jugadores si está verificado
 * y con antecedentes comprobados (libro §2).
 */
export function canContactPlayers(flags: { verified?: boolean | null; backgroundChecked?: boolean | null }): boolean {
  return Boolean(flags.verified && flags.backgroundChecked);
}

/**
 * ¿Puede aparecer en The "1%" Factor? Los especialistas se publican solo si el
 * admin los ha verificado (libro §2). Base para construir el marketplace (Parte 4).
 */
export function isListable(flags: { verified?: boolean | null }): boolean {
  return Boolean(flags.verified);
}
