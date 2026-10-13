/**
 * Perfil de club: los chips (equivalente al «abierto a» del player) y la
 * checklist ponderada que mide la fuerza del perfil del club.
 *
 * Única fuente de verdad: la comparten la página del perfil, el formulario de
 * edición y los tests, igual que `PROFILE_CHECKLIST` para el player.
 */
import type { ProfileChecklistItem } from './profile';

// ---------------------------------------------------------------------------
// Chips del club
// ---------------------------------------------------------------------------

/** Señales que un club puede mostrar como chips en su perfil. */
export const CLUB_PROFILE_TAGS = [
  'RECRUITING',
  'TRIALS',
  'SCHOLARSHIPS',
  'LOANS',
  'YOUTH',
  'WOMEN',
] as const;
export type ClubProfileTag = (typeof CLUB_PROFILE_TAGS)[number];

export const CLUB_PROFILE_TAG_LABELS: Record<ClubProfileTag, string> = {
  RECRUITING: 'Recruiting players',
  TRIALS: 'Open trials',
  SCHOLARSHIPS: 'Scholarships',
  LOANS: 'Loan deals',
  YOUTH: 'Youth academy',
  WOMEN: "Women's football",
};

/** Máximo de chips publicados (el formulario corta al guardar). */
export const CLUB_PROFILE_TAGS_MAX = 3;

/** ¿Es un chip conocido? */
export function isClubProfileTag(value: unknown): value is ClubProfileTag {
  return typeof value === 'string' && (CLUB_PROFILE_TAGS as readonly string[]).includes(value);
}

/**
 * Normaliza lo que llega del formulario (checkboxes): descarta valores
 * desconocidos, quita duplicados y aplica el máximo. Nunca lanza.
 */
export function sanitizeClubProfileTags(values: readonly unknown[]): ClubProfileTag[] {
  const seen = new Set<ClubProfileTag>();
  for (const value of values) {
    if (isClubProfileTag(value)) seen.add(value);
  }
  return [...seen].slice(0, CLUB_PROFILE_TAGS_MAX);
}

/** Tags listas para pintar un array guardado (ignora lo desconocido). */
export function clubProfileTagLabels(values: readonly string[]): string[] {
  return values.filter(isClubProfileTag).map((value) => CLUB_PROFILE_TAG_LABELS[value]);
}

// ---------------------------------------------------------------------------
// Profile strength del club (checklist ponderada)
// ---------------------------------------------------------------------------

/** Claves de la checklist del club, en orden de presentación. */
export const CLUB_PROFILE_CHECKLIST_KEYS = [
  'name',
  'country',
  'city',
  'league',
  'foundedYear',
  'description',
  'headline',
  'logo',
  'banner',
  'tags',
  'opportunity',
  'staff',
] as const;
export type ClubProfileChecklistKey = (typeof CLUB_PROFILE_CHECKLIST_KEYS)[number];

/** La suma de los pesos es exactamente 100. */
export const CLUB_PROFILE_CHECKLIST: readonly ProfileChecklistItem[] = [
  {
    key: 'name',
    label: 'Club name',
    hint: 'The first thing players, scouts and families see.',
    weight: 8,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'country',
    label: 'Country',
    hint: 'It feeds the geographic filters of the search.',
    weight: 6,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'city',
    label: 'City',
    hint: 'Players want to know where they would move to.',
    weight: 6,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'league',
    label: 'League or division',
    hint: 'It sets the level of the club in the search.',
    weight: 10,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'foundedYear',
    label: 'Founded in',
    hint: 'History and tradition build trust.',
    weight: 8,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'description',
    label: 'About the club',
    hint: 'Explain the project, the methodology and what you offer.',
    weight: 12,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'headline',
    label: 'Headline',
    hint: 'A short line that sums up the club.',
    weight: 8,
    href: '/dashboard/club/profile/edit#personalizacion',
  },
  {
    key: 'logo',
    label: 'Club crest',
    hint: 'Profiles with a crest get far more views.',
    weight: 10,
    href: '/dashboard/club/profile/edit',
  },
  {
    key: 'banner',
    label: 'Cover photo',
    hint: 'Customise the header of your profile.',
    weight: 6,
    href: '/dashboard/club/profile/edit#personalizacion',
  },
  {
    key: 'tags',
    label: 'At least one tag',
    hint: 'Tell at a glance what you are looking for.',
    weight: 8,
    href: '/dashboard/club/profile/edit#personalizacion',
  },
  {
    key: 'opportunity',
    label: 'Publish an opportunity',
    hint: 'It is the main way players reach you.',
    weight: 8,
    href: '/dashboard/club/opportunities',
  },
  {
    key: 'staff',
    label: 'Invite your staff',
    hint: 'The whole team can work on the same account.',
    weight: 10,
    href: '/dashboard/club/staff',
  },
];

/** Puntos totales de la checklist del club (100). */
export const CLUB_PROFILE_CHECKLIST_POINTS = CLUB_PROFILE_CHECKLIST.reduce(
  (total, item) => total + item.weight,
  0
);
