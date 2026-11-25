/**
 * Utilidades (sin Prisma) del perfil del Health Agent: etiquetas legibles y el
 * estado de completitud que alimenta la checklist del perfil.
 */

export const HEALTH_AGENT_SPECIALTY_LABELS: Record<string, string> = {
  NUTRITION: 'Nutrition',
  PSYCHOLOGY: 'Sport psychology',
  PHYSIOTHERAPY: 'Physiotherapy',
};

export const HEALTH_AGENT_FORMAT_LABELS: Record<string, string> = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  BOTH: 'In person & online',
};

export interface HealthAgentChecklistState {
  percent: number;
  items: { label: string; done: boolean }[];
}

/** Campos mínimos que se evalúan para la checklist de completitud. */
export interface HealthAgentChecklistInput {
  headline?: string | null;
  about?: string | null;
  specialties?: string[] | null;
  services?: string[] | null;
  approach?: string[] | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  priceFrom?: number | null;
  registrationNumber?: string | null;
  insuranceProvider?: string | null;
  languages?: string[] | null;
  yearsExperience?: number | null;
}

/**
 * Ponderación simple de lo que un jugador/familia espera ver antes de reservar.
 * Devuelve el porcentaje y cada señal, para pintar la tarjeta de "fuerza del perfil".
 */
export function healthAgentProfileChecklist(
  agent: HealthAgentChecklistInput | null
): HealthAgentChecklistState {
  const items = [
    { label: 'Practice headline', done: Boolean(agent?.headline) },
    { label: 'About your practice', done: Boolean(agent?.about) },
    { label: 'At least one specialty', done: Boolean(agent?.specialties?.length) },
    { label: 'Services listed', done: Boolean(agent?.services?.length) },
    { label: 'Approach to care', done: Boolean(agent?.approach?.length) },
    { label: 'Location (city and country)', done: Boolean(agent?.city && agent?.country) },
    { label: 'Website', done: Boolean(agent?.website) },
    { label: 'Price from', done: agent?.priceFrom != null },
    { label: 'Registration number', done: Boolean(agent?.registrationNumber) },
    { label: 'Insurance', done: Boolean(agent?.insuranceProvider) },
    { label: 'Languages', done: Boolean(agent?.languages?.length) },
    { label: 'Years of experience', done: agent?.yearsExperience != null },
  ];
  const done = items.filter((item) => item.done).length;
  return { percent: Math.round((done / items.length) * 100), items };
}

/** "Valencia, Spain" o `null` si no hay ubicación. */
export function healthAgentLocation(
  agent: { city?: string | null; country?: string | null } | null
): string | null {
  const parts = [agent?.city, agent?.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/** "€60" (o "$60" / "£60" / "A$60") con el precio mínimo de la práctica. */
export function formatPriceFrom(priceFrom: number | null, currency: string): string | null {
  if (priceFrom == null) return null;
  const symbol =
    currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : '€';
  return `${symbol}${priceFrom}`;
}
