export interface MatchPlayer {
  position?: string | null;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  competitionLevel?: string | null;
  status: string;
}

export interface MatchRequirement {
  position?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  level?: string | null;
  country?: string | null;
  location?: string | null;
}

export interface MatchCriterion {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface MatchScore {
  total: number; // 0-100
  criteria: MatchCriterion[];
  summary: string;
}

export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Score 0-100 entre el perfil de un jugador y los requisitos de un club.
 * Criterios: posición (25), edad (25), nivel (20), disponibilidad (15), geografía (15).
 * Cada criterio devuelve puntos + explicación.
 */
export function matchScore(player: MatchPlayer, requirement: MatchRequirement): MatchScore {
  const criteria: MatchCriterion[] = [];

  // Posición (25)
  const positionMax = 25;
  let positionScore: number;
  let positionDetail: string;
  if (!requirement.position) {
    positionScore = positionMax;
    positionDetail = 'Sin requisito de posición (peso neutro)';
  } else if (player.position && player.position === requirement.position) {
    positionScore = positionMax;
    positionDetail = `Coincide con la posición requerida (${requirement.position})`;
  } else {
    positionScore = 0;
    positionDetail = `Posición ${player.position ?? 'sin definir'} no coincide con ${requirement.position}`;
  }
  criteria.push({
    key: 'position',
    label: 'Posición',
    score: positionScore,
    max: positionMax,
    detail: positionDetail,
  });

  // Edad (25)
  const ageMax = 25;
  let ageScore: number;
  let ageDetail: string;
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : null;
  if (!requirement.ageMin && !requirement.ageMax) {
    ageScore = ageMax;
    ageDetail = 'Sin rango de edad requerido';
  } else if (age === null) {
    ageScore = Math.round(ageMax / 2);
    ageDetail = 'Edad del jugador no informada (puntuación parcial)';
  } else {
    const min = requirement.ageMin ?? -Infinity;
    const max = requirement.ageMax ?? Infinity;
    if (age >= min && age <= max) {
      ageScore = ageMax;
      ageDetail = `Edad ${age} dentro del rango requerido`;
    } else if (age >= min - 2 && age <= max + 2) {
      ageScore = Math.round(ageMax / 2);
      ageDetail = `Edad ${age} cercana al rango requerido (${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'})`;
    } else {
      ageScore = 0;
      ageDetail = `Edad ${age} fuera del rango requerido (${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'})`;
    }
  }
  criteria.push({ key: 'age', label: 'Edad', score: ageScore, max: ageMax, detail: ageDetail });

  // Nivel (20)
  const levelMax = 20;
  let levelScore: number;
  let levelDetail: string;
  if (!requirement.level) {
    levelScore = levelMax;
    levelDetail = 'Sin nivel requerido';
  } else if (player.competitionLevel === requirement.level) {
    levelScore = levelMax;
    levelDetail = `Nivel competitivo coincidente (${requirement.level})`;
  } else if (player.competitionLevel) {
    levelScore = 10;
    levelDetail = `Nivel ${player.competitionLevel} vs requerido ${requirement.level}`;
  } else {
    levelScore = Math.round(levelMax / 2);
    levelDetail = 'Nivel del jugador no informado (puntuación parcial)';
  }
  criteria.push({ key: 'level', label: 'Nivel', score: levelScore, max: levelMax, detail: levelDetail });

  // Disponibilidad (15)
  const availabilityMax = 15;
  const available = player.status === 'AVAILABLE' || player.status === 'ACTIVE';
  criteria.push({
    key: 'availability',
    label: 'Disponibilidad',
    score: available ? availabilityMax : 0,
    max: availabilityMax,
    detail: available ? 'Jugador disponible' : `Estado actual: ${player.status}`,
  });

  // Geografía (15)
  const geographyMax = 15;
  let geographyScore: number;
  let geographyDetail: string;
  const requiredPlace = requirement.country ?? requirement.location ?? null;
  if (!requiredPlace) {
    geographyScore = geographyMax;
    geographyDetail = 'Sin restricción geográfica';
  } else if (
    player.nationality &&
    requiredPlace.toLowerCase().includes(player.nationality.toLowerCase())
  ) {
    geographyScore = geographyMax;
    geographyDetail = `Nacionalidad compatible con ${requiredPlace}`;
  } else if (player.nationality) {
    geographyScore = 0;
    geographyDetail = `Nacionalidad ${player.nationality} vs ${requiredPlace}`;
  } else {
    geographyScore = Math.round(geographyMax / 2);
    geographyDetail = 'Nacionalidad no informada (puntuación parcial)';
  }
  criteria.push({
    key: 'geography',
    label: 'Geografía',
    score: geographyScore,
    max: geographyMax,
    detail: geographyDetail,
  });

  const total = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const summary =
    total >= 80 ? 'Muy buena coincidencia' : total >= 60 ? 'Buena coincidencia' : total >= 40 ? 'Coincidencia media' : 'Coincidencia baja';

  return { total, criteria, summary };
}
