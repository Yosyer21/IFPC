/**
 * Personalización del perfil del jugador: portada, titular, acento de color,
 * chips de «abierto a» y la checklist ponderada que mide la fuerza del perfil.
 *
 * Única fuente de verdad: la página del perfil, el formulario de edición, el
 * perfil público y los tests leen de aquí, así que añadir un acento o un ítem de
 * la checklist no obliga a tocar componentes.
 */

// ---------------------------------------------------------------------------
// Acento (color del perfil)
// ---------------------------------------------------------------------------

/** Acentos permitidos. Paleta cerrada: garantiza contraste y coherencia visual. */
export const PROFILE_ACCENTS = ['emerald', 'cyan', 'lime', 'amber', 'violet'] as const;
export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];

export const DEFAULT_PROFILE_ACCENT: ProfileAccent = 'emerald';

export const PROFILE_ACCENT_PALETTE: Record<
  ProfileAccent,
  { label: string; hex: string; soft: string }
> = {
  emerald: { label: 'Esmeralda', hex: '#34d399', soft: 'rgba(52, 211, 153, 0.16)' },
  cyan: { label: 'Cian', hex: '#22d3ee', soft: 'rgba(34, 211, 238, 0.16)' },
  lime: { label: 'Lima', hex: '#a3e635', soft: 'rgba(163, 230, 53, 0.16)' },
  amber: { label: 'Ámbar', hex: '#fbbf24', soft: 'rgba(251, 191, 36, 0.16)' },
  violet: { label: 'Violeta', hex: '#c084fc', soft: 'rgba(192, 132, 252, 0.16)' },
};

/** ¿Es un acento soportado? */
export function isProfileAccent(value: unknown): value is ProfileAccent {
  return typeof value === 'string' && (PROFILE_ACCENTS as readonly string[]).includes(value);
}

/** Acento guardado o el de marca por defecto (nunca lanza). */
export function resolveProfileAccent(value: string | null | undefined): ProfileAccent {
  return isProfileAccent(value) ? value : DEFAULT_PROFILE_ACCENT;
}

/** Colores listos para pintar: nunca `undefined`, aunque no haya acento guardado. */
export function profileAccentColors(value: string | null | undefined): {
  label: string;
  hex: string;
  soft: string;
} {
  return PROFILE_ACCENT_PALETTE[resolveProfileAccent(value)];
}

// ---------------------------------------------------------------------------
// Titular, ubicación y «abierto a»
// ---------------------------------------------------------------------------

/** Longitud máxima del titular que se muestra bajo el nombre. */
export const PROFILE_HEADLINE_MAX = 120;
/** Longitud máxima de la ubicación (ciudad y país). */
export const PROFILE_LOCATION_MAX = 80;

/** Señales de disponibilidad que el jugador puede mostrar como chips. */
export const PROFILE_OPEN_TO = ['CLUB', 'TRIAL', 'SCHOLARSHIP', 'COLLEGE', 'AGENT'] as const;
export type ProfileOpenTo = (typeof PROFILE_OPEN_TO)[number];

export const PROFILE_OPEN_TO_LABELS: Record<ProfileOpenTo, string> = {
  CLUB: 'Busco club',
  TRIAL: 'Abierto a pruebas',
  SCHOLARSHIP: 'Beca deportiva',
  COLLEGE: 'Fútbol universitario',
  AGENT: 'Busco representante',
};

/** Máximo de chips publicados (el formulario corta al guardar). */
export const PROFILE_OPEN_TO_MAX = 3;

/** ¿Es una señal conocida? */
export function isProfileOpenTo(value: unknown): value is ProfileOpenTo {
  return typeof value === 'string' && (PROFILE_OPEN_TO as readonly string[]).includes(value);
}

/**
 * Normaliza lo que llega del formulario (checkboxes): descarta valores
 * desconocidos, quita duplicados y aplica el máximo. Nunca lanza.
 */
export function sanitizeProfileOpenTo(values: readonly unknown[]): ProfileOpenTo[] {
  const seen = new Set<ProfileOpenTo>();
  for (const value of values) {
    if (isProfileOpenTo(value)) seen.add(value);
  }
  return [...seen].slice(0, PROFILE_OPEN_TO_MAX);
}

/** Etiquetas listas para pintar un array guardado (ignora lo desconocido). */
export function profileOpenToLabels(values: readonly string[]): string[] {
  return values.filter(isProfileOpenTo).map((value) => PROFILE_OPEN_TO_LABELS[value]);
}

// ---------------------------------------------------------------------------
// Portada
// ---------------------------------------------------------------------------

/** Tamaño máximo de la imagen de portada (4 MB). */
export const PROFILE_BANNER_MAX_BYTES = 4 * 1024 * 1024;
export const PROFILE_BANNER_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// ---------------------------------------------------------------------------
// Fuerza del perfil (checklist ponderada)
// ---------------------------------------------------------------------------

/** Claves de la checklist, en orden de presentación. */
export const PROFILE_CHECKLIST_KEYS = [
  'name',
  'dateOfBirth',
  'nationality',
  'position',
  'foot',
  'competitionLevel',
  'physicalData',
  'clubName',
  'bio',
  'photo',
  'banner',
  'headline',
  'video',
  'career',
] as const;
export type ProfileChecklistKey = (typeof PROFILE_CHECKLIST_KEYS)[number];

export interface ProfileChecklistItem {
  key: ProfileChecklistKey;
  label: string;
  /** Por qué importa: se muestra como ayuda del ítem pendiente. */
  hint: string;
  /** Puntos sobre 100. La suma de todos los ítems es exactamente 100. */
  weight: number;
  /** Dónde se completa. */
  href: string;
}

export const PROFILE_CHECKLIST: readonly ProfileChecklistItem[] = [
  {
    key: 'name',
    label: 'Nombre y apellidos',
    hint: 'Es lo primero que ven clubes y ojeadores.',
    weight: 8,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'dateOfBirth',
    label: 'Fecha de nacimiento',
    hint: 'Marca tu categoría y los filtros de edad del reclutamiento.',
    weight: 6,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'nationality',
    label: 'Nacionalidad',
    hint: 'Necesaria para becas y oportunidades internacionales.',
    weight: 6,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'position',
    label: 'Posición',
    hint: 'El filtro principal de búsqueda de los clubes.',
    weight: 10,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'foot',
    label: 'Pierna buena',
    hint: 'Un detalle que los ojeadores revisan siempre.',
    weight: 4,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'competitionLevel',
    label: 'Nivel competitivo',
    hint: 'Ubica tu perfil entre los candidatos.',
    weight: 8,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'physicalData',
    label: 'Altura y peso',
    hint: 'Se completan los dos datos a la vez.',
    weight: 10,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'clubName',
    label: 'Club actual',
    hint: 'Da contexto a tu trayectoria.',
    weight: 8,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'bio',
    label: 'Biografía',
    hint: 'Cuenta tu historia en primera persona.',
    weight: 8,
    href: '/dashboard/player/profile/edit',
  },
  {
    key: 'photo',
    label: 'Foto de perfil',
    hint: 'Los perfiles con foto reciben muchas más visitas.',
    weight: 8,
    href: '/dashboard/player/profile',
  },
  {
    key: 'banner',
    label: 'Portada',
    hint: 'Personaliza la cabecera de tu perfil.',
    weight: 6,
    href: '/dashboard/player/profile/edit#personalizacion',
  },
  {
    key: 'headline',
    label: 'Titular',
    hint: 'Una frase corta que resuma tu juego.',
    weight: 6,
    href: '/dashboard/player/profile/edit#personalizacion',
  },
  {
    key: 'video',
    label: 'Al menos un vídeo',
    hint: 'Un highlight vale más que mil palabras.',
    weight: 6,
    href: '/dashboard/player/videos',
  },
  {
    key: 'career',
    label: 'Trayectoria',
    hint: 'Clubes, categorías y estadísticas por temporada.',
    weight: 6,
    href: '/dashboard/player/career',
  },
];

/** Puntos totales de la checklist (hoy 100). */
export const PROFILE_CHECKLIST_POINTS = PROFILE_CHECKLIST.reduce(
  (total, item) => total + item.weight,
  0
);

export interface ProfileChecklistState {
  /** Todos los ítems con su estado, en orden de presentación. */
  items: (ProfileChecklistItem & { done: boolean })[];
  percent: number;
  /** Ítems completados (para el «8/14» de la UI). */
  completed: number;
  total: number;
  /** Puntos conseguidos sobre `PROFILE_CHECKLIST_POINTS`. */
  points: number;
  /** El ítem pendiente que más suma: el «siguiente mejor paso». */
  next: ProfileChecklistItem | null;
}

/**
 * Puntúa la checklist: porcentaje ponderado, ítems completados y el siguiente
 * mejor paso (el pendiente de mayor peso; a igualdad, el primero declarado).
 */
export function profileChecklistScore(
  done: Partial<Record<ProfileChecklistKey, boolean>> = {}
): ProfileChecklistState {
  const items = PROFILE_CHECKLIST.map((item) => ({ ...item, done: done[item.key] === true }));
  const points = items.reduce((total, item) => total + (item.done ? item.weight : 0), 0);
  const completed = items.filter((item) => item.done).length;
  const next = items
    .filter((item) => !item.done)
    .reduce<ProfileChecklistItem | null>(
      (best, item) => (best && best.weight >= item.weight ? best : item),
      null
    );

  return {
    items,
    percent:
      PROFILE_CHECKLIST_POINTS === 0 ? 0 : Math.round((points / PROFILE_CHECKLIST_POINTS) * 100),
    completed,
    total: items.length,
    points,
    next,
  };
}
