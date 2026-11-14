import { POSITION_LABELS } from '@ifpc/config';

/**
 * Scouting del club («Find players»): filtros puros por demarcación y edad.
 *
 * Las posiciones del modelo son las de `@ifpc/config` (`POR`, `DEF`, `LAT`,
 * `CAR`, `MED`, `PIV`, `EXT`, `DEL`); la UI las agrupa en cuatro familias y en
 * cuatro categorías de edad. Todo es puro para poder testearlo sin base de datos.
 */

export type ScoutingPositionFilter = 'all' | 'keepers' | 'defenders' | 'midfield' | 'forwards';
export type ScoutingAgeFilter = 'all' | 'u14' | 'u16' | 'u17' | 'u19';
export type ScoutingGroup = Exclude<ScoutingPositionFilter, 'all'>;
export type ScoutingAgeGroup = Exclude<ScoutingAgeFilter, 'all'>;

export interface ScoutingFilters {
  position: ScoutingPositionFilter;
  age: ScoutingAgeFilter;
}

export const SCOUTING_POSITION_FILTERS: readonly { id: ScoutingPositionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'keepers', label: 'Keepers' },
  { id: 'defenders', label: 'Defenders' },
  { id: 'midfield', label: 'Midfield' },
  { id: 'forwards', label: 'Forwards' },
];

export const SCOUTING_AGE_FILTERS: readonly { id: ScoutingAgeFilter; label: string }[] = [
  { id: 'all', label: 'All ages' },
  { id: 'u14', label: 'U14' },
  { id: 'u16', label: 'U16' },
  { id: 'u17', label: 'U17' },
  { id: 'u19', label: 'U19+' },
];

const POSITION_GROUPS: Record<string, ScoutingGroup> = {
  POR: 'keepers',
  DEF: 'defenders',
  LAT: 'defenders',
  CAR: 'defenders',
  MED: 'midfield',
  PIV: 'midfield',
  EXT: 'forwards',
  DEL: 'forwards',
};

const AGE_LABELS: Record<ScoutingAgeGroup, string> = {
  u14: 'U14',
  u16: 'U16',
  u17: 'U17',
  u19: 'U19+',
};

/** Familia de una posición (o `null` si no está definida). */
export function positionGroup(position: string | null | undefined): ScoutingGroup | null {
  if (!position) return null;
  return POSITION_GROUPS[position] ?? null;
}

/** Etiqueta legible de la posición; nunca lanza. */
export function positionLabel(position: string | null | undefined): string {
  if (!position) return 'Position TBD';
  return (POSITION_LABELS as Record<string, string | undefined>)[position] ?? position;
}

/** Edad cumplida (UTC) a partir de la fecha de nacimiento. */
export function ageOn(dateOfBirth: Date | null, now: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** Categoría de edad: U14 (<15), U16 (15-16), U17 (17), U19+ (18+). */
export function scoutingAgeGroup(age: number | null): ScoutingAgeGroup | null {
  if (age === null) return null;
  if (age < 15) return 'u14';
  if (age < 17) return 'u16';
  if (age === 17) return 'u17';
  return 'u19';
}

/** Etiqueta de la categoría (`U17`…). */
export function ageGroupLabel(group: ScoutingAgeGroup): string {
  return AGE_LABELS[group];
}

function isPositionFilter(value: string | undefined): value is ScoutingPositionFilter {
  return SCOUTING_POSITION_FILTERS.some((filter) => filter.id === value);
}

function isAgeFilter(value: string | undefined): value is ScoutingAgeFilter {
  return SCOUTING_AGE_FILTERS.some((filter) => filter.id === value);
}

/** Filtros desde `searchParams`; cualquier valor raro cae en «All». */
export function parseScoutingFilters(params: { position?: string; age?: string }): ScoutingFilters {
  return {
    position: isPositionFilter(params.position) ? params.position : 'all',
    age: isAgeFilter(params.age) ? params.age : 'all',
  };
}

/** ¿El jugador entra en los filtros activos? */
export function matchesScoutingFilters(
  player: { position: string | null; dateOfBirth: Date | null },
  filters: ScoutingFilters,
  now: Date = new Date()
): boolean {
  if (filters.position !== 'all' && positionGroup(player.position) !== filters.position) {
    return false;
  }
  if (filters.age !== 'all') {
    const group = scoutingAgeGroup(ageOn(player.dateOfBirth, now));
    if (group !== filters.age) return false;
  }
  return true;
}

/** URL de la página conservando los filtros activos. */
export function scoutingHref(basePath: string, filters: ScoutingFilters): string {
  const params = new URLSearchParams();
  if (filters.position !== 'all') params.set('position', filters.position);
  if (filters.age !== 'all') params.set('age', filters.age);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
