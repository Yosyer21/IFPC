import { calculateAge, type MatchCriterion } from './engine';

/**
 * % de afinidad: encaje **amplio** entre un jugador y un club, universidad o
 * colegio. A diferencia de `matchScore` (un requisito concreto), aquí se mezclan
 * las necesidades abiertas, la trayectoria y la ubicación para responder a
 * «¿este jugador encaja con nosotros?».
 *
 * Reglas (0-100):
 * - posición necesaria (30), edad/categoría (25), nivel (15), actividad y clips
 *   (15) y geografía (15);
 * - sin datos de un criterio se puntúa neutro/parcial, nunca 0;
 * - las estadísticas ocultas por el padre de un menor de 16 se pasan como
 *   `null` y no se usan (privacidad).
 */
export interface AffinityPlayer {
  position?: string | null;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  location?: string | null;
  clubName?: string | null;
  competitionLevel?: string | null;
  /** Partidos jugados. `null` = dato no compartido. */
  appearances?: number | null;
  /** Goles + asistencias. `null` = dato no compartido. */
  goalContributions?: number | null;
  /** Clips del Film Room. `null` = dato no compartido. */
  highlights?: number | null;
}

export interface AffinityTarget {
  kind: 'club' | 'university' | 'school';
  name?: string | null;
  country?: string | null;
  city?: string | null;
  /** Posiciones con necesidad abierta (requisitos u oportunidades). */
  positions?: readonly (string | null)[] | null;
  ageMin?: number | null;
  ageMax?: number | null;
  /** Niveles/categorías que busca el destino. */
  levels?: readonly (string | null)[] | null;
}

export interface AffinityScore {
  total: number;
  criteria: MatchCriterion[];
  summary: string;
  kind: AffinityTarget['kind'];
}

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';

function uniqueValues(values: readonly (string | null)[] | null | undefined): string[] {
  return [...new Set((values ?? []).map(normalize).filter(Boolean))];
}

export function affinityScore(player: AffinityPlayer, target: AffinityTarget): AffinityScore {
  const criteria: MatchCriterion[] = [];
  const positions = uniqueValues(target.positions);
  const levels = uniqueValues(target.levels);

  // 1) Posición: ¿hay necesidad abierta en su demarcación? (30)
  const positionMax = 30;
  let positionScore: number;
  let positionDetail: string;
  if (positions.length === 0) {
    positionScore = positionMax;
    positionDetail = 'No open position need (neutral weight)';
  } else if (player.position && positions.includes(normalize(player.position))) {
    positionScore = positionMax;
    positionDetail = `Open need for ${player.position}`;
  } else {
    positionScore = 0;
    positionDetail = `No open need for ${player.position ?? 'their position'}`;
  }
  criteria.push({
    key: 'position',
    label: 'Position need',
    score: positionScore,
    max: positionMax,
    detail: positionDetail,
  });

  // 2) Edad/categoría (25)
  const ageMax = 25;
  const hasAgeRange = target.ageMin != null || target.ageMax != null;
  const rangeLabel = `${target.ageMin ?? '?'}–${target.ageMax ?? '?'}`;
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : null;
  let ageScore: number;
  let ageDetail: string;
  if (!hasAgeRange) {
    ageScore = ageMax;
    ageDetail = 'No age range required (neutral weight)';
  } else if (age === null) {
    ageScore = Math.round(ageMax / 2);
    ageDetail = 'Age not provided (partial score)';
  } else {
    const min = target.ageMin ?? -Infinity;
    const max = target.ageMax ?? Infinity;
    if (age >= min && age <= max) {
      ageScore = ageMax;
      ageDetail = `Age ${age} within ${rangeLabel}`;
    } else if (age >= min - 2 && age <= max + 2) {
      ageScore = Math.round(ageMax / 2);
      ageDetail = `Age ${age} close to ${rangeLabel}`;
    } else {
      ageScore = 0;
      ageDetail = `Age ${age} outside ${rangeLabel}`;
    }
  }
  criteria.push({
    key: 'age',
    label: 'Age / category',
    score: ageScore,
    max: ageMax,
    detail: ageDetail,
  });

  // 3) Nivel competitivo (15)
  const levelMax = 15;
  let levelScore: number;
  let levelDetail: string;
  if (levels.length === 0) {
    levelScore = levelMax;
    levelDetail = 'No level required (neutral weight)';
  } else if (!player.competitionLevel) {
    levelScore = Math.round(levelMax / 2);
    levelDetail = 'Player level not provided (partial score)';
  } else if (levels.includes(normalize(player.competitionLevel))) {
    levelScore = levelMax;
    levelDetail = `Level ${player.competitionLevel} fits`;
  } else {
    levelScore = 5;
    levelDetail = `Level ${player.competitionLevel} vs ${(target.levels ?? [])
      .filter(Boolean)
      .join(', ')}`;
  }
  criteria.push({
    key: 'level',
    label: 'Level',
    score: levelScore,
    max: levelMax,
    detail: levelDetail,
  });

  // 4) Actividad y material de scouting (15)
  const activityMax = 15;
  const appearances = player.appearances ?? null;
  const contributions = player.goalContributions ?? null;
  const highlights = player.highlights ?? null;
  let activityScore: number;
  let activityDetail: string;
  if (appearances === null && contributions === null && highlights === null) {
    activityScore = Math.round(activityMax / 2);
    activityDetail = 'Activity not shared (neutral weight)';
  } else {
    let score = 0;
    const parts: string[] = [];
    if (appearances !== null) {
      score +=
        appearances >= 20 ? 8 : appearances >= 10 ? 6 : appearances >= 3 ? 4 : appearances >= 1 ? 2 : 0;
      parts.push(`${appearances} apps`);
    }
    if (contributions !== null) {
      score += contributions >= 10 ? 4 : contributions >= 4 ? 3 : contributions >= 1 ? 2 : 0;
      parts.push(`${contributions} goals+assists`);
    }
    if (highlights !== null) {
      score += highlights >= 3 ? 3 : highlights >= 1 ? 2 : 0;
      parts.push(`${highlights} clips`);
    }
    activityScore = Math.min(score, activityMax);
    activityDetail = parts.length
      ? `Track record: ${parts.join(' · ')}`
      : 'No activity recorded yet';
  }
  criteria.push({
    key: 'activity',
    label: 'Activity & output',
    score: activityScore,
    max: activityMax,
    detail: activityDetail,
  });

  // 5) Geografía (15)
  const geographyMax = 15;
  const targetPlaces = [normalize(target.city), normalize(target.country)].filter(Boolean);
  const playerPlaces = [
    normalize(player.location),
    normalize(player.nationality),
    normalize(player.clubName),
  ].filter(Boolean);
  let geographyScore: number;
  let geographyDetail: string;
  if (targetPlaces.length === 0) {
    geographyScore = geographyMax;
    geographyDetail = 'No location restriction (neutral weight)';
  } else if (playerPlaces.length === 0) {
    geographyScore = Math.round(geographyMax / 2);
    geographyDetail = 'Player location not provided (partial score)';
  } else if (
    playerPlaces.some((place) =>
      targetPlaces.some((targetPlace) => targetPlace.includes(place) || place.includes(targetPlace))
    )
  ) {
    geographyScore = geographyMax;
    geographyDetail = `Based near ${target.city ?? target.country}`;
  } else {
    geographyScore = 0;
    geographyDetail = `Location ${player.location ?? player.nationality} vs ${
      target.city ?? target.country
    }`;
  }
  criteria.push({
    key: 'geography',
    label: 'Geography',
    score: geographyScore,
    max: geographyMax,
    detail: geographyDetail,
  });

  const total = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const summary =
    total >= 80
      ? 'Strong affinity'
      : total >= 60
        ? 'Good affinity'
        : total >= 40
          ? 'Some affinity'
          : 'Low affinity';

  return { total, criteria, summary, kind: target.kind };
}
