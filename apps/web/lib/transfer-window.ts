import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';

/**
 * Vista «Transfer window» del área del jugador.
 *
 * Une las tres fuentes reales de reclutamiento (invitaciones a prueba,
 * negociaciones y oportunidades abiertas) en un modelo **serializable**, apto
 * para pasarse a un componente cliente. Aquí no se pinta nada: solo se
 * normaliza, se filtra y se calculan contadores, para poder testearlo sin base
 * de datos ni relojes reales (todas las funciones aceptan `now`).
 */

export type TransferCategory = 'ALL' | 'UNIVERSITY' | 'SCHOOL' | 'TRIALS';

export const TRANSFER_CATEGORIES: readonly { id: TransferCategory; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'UNIVERSITY', label: 'University' },
  { id: 'SCHOOL', label: 'School' },
  { id: 'TRIALS', label: 'Trials' },
];

/** Días durante los que una oferta se marca como «nueva». */
export const NEW_OFFER_WINDOW_DAYS = 7;

export type OfferKind = 'TRIAL' | 'NEGOTIATION';

/** Categoría de filtro de una tarjeta (nunca `ALL`: eso es el filtro). */
export type ItemCategory = Exclude<TransferCategory, 'ALL'>;

export interface TransferOffer {
  id: string;
  kind: OfferKind;
  /** Etiqueta corta de la tarjeta: TRIAL, CONTRACT… */
  tag: string;
  isNew: boolean;
  title: string;
  organisation: string;
  message: string | null;
  meta: string | null;
  /** Días para responder; `null` cuando la oferta no caduca. */
  daysToReply: number | null;
  category: ItemCategory;
  /** Detalle al que puede ir el jugador (perfil público del club/organización). */
  href: string;
}

export interface TransferMatch {
  id: string;
  title: string;
  organisation: string;
  type: string;
  category: ItemCategory;
  match: number;
  location: string | null;
  closesInDays: number | null;
  href: string;
}

export interface TransferApplication {
  id: string;
  title: string;
  organisation: string;
  type: string;
  category: ItemCategory;
  status: string;
  daysAgo: number;
  href: string;
}

export interface TransferWindowStats {
  offersWaiting: number;
  matches: number;
  applications: number;
}

/** Días completos que faltan hasta `date` (0 si ya pasó). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

/** Días completos transcurridos desde `date` (0 si es futura). */
export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

/** ¿La oferta entró dentro de la ventana de «nueva»? */
export function isNewOffer(createdAt: Date, now: Date = new Date()): boolean {
  return daysSince(createdAt, now) < NEW_OFFER_WINDOW_DAYS;
}

/** Etiqueta legible del tipo de oportunidad (nunca lanza). */
export function opportunityTypeLabel(type: string): string {
  return (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[type] ?? type;
}

/**
 * Categoría de filtro de una oportunidad:
 * - **University**: la publica una universidad (o la creó ese rol).
 * - **School**: programas de academia/colegio (`ACADEMY`), que es lo único que
 *   el modelo de datos distingue del resto hoy.
 * - **Trials**: el resto (pruebas, scouting, contratos y becas de club).
 */
export function opportunityCategory(opportunity: OpportunityLike): ItemCategory {
  if (opportunity.universityId || opportunity.creatorType === 'UNIVERSITY') return 'UNIVERSITY';
  if (opportunity.type === 'ACADEMY') return 'SCHOOL';
  return 'TRIALS';
}

export interface OpportunityLike {
  id: string;
  title: string;
  type: string;
  location: string | null;
  closesAt: Date | null;
  clubId?: string | null;
  universityId?: string | null;
  creatorType?: string | null;
  club?: { id: string; name: string } | null;
  university?: { id: string; name: string } | null;
}

export interface TrialLike {
  id: string;
  createdAt: Date;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  notes: string | null;
  club: { id: string; name: string };
  submission?: { notes: string | null } | null;
}

export interface NegotiationLike {
  id: string;
  createdAt: Date;
  notes: string | null;
  club: { id: string; name: string };
}

export interface ApplicationLike {
  id: string;
  status: string;
  createdAt: Date;
  opportunity: OpportunityLike;
}

function organisationOf(opportunity: OpportunityLike): string {
  return opportunity.club?.name ?? opportunity.university?.name ?? '—';
}

/** Invitación a prueba enviada por un club. */
export function offerFromTrial(trial: TrialLike, now: Date = new Date()): TransferOffer {
  return {
    id: trial.id,
    kind: 'TRIAL',
    tag: 'TRIAL',
    isNew: isNewOffer(trial.createdAt, now),
    title: `${trial.club.name} trial invitation`,
    organisation: trial.club.name,
    message: trial.submission?.notes?.trim() || trial.notes?.trim() || null,
    meta: trial.location,
    daysToReply: daysUntil(trial.endsAt ?? trial.startsAt, now),
    category: 'TRIALS',
    href: `/clubs/${trial.club.id}`,
  };
}

/** Oferta de contrato abierta por un club. */
export function offerFromNegotiation(
  negotiation: NegotiationLike,
  now: Date = new Date()
): TransferOffer {
  return {
    id: negotiation.id,
    kind: 'NEGOTIATION',
    tag: 'CONTRACT',
    isNew: isNewOffer(negotiation.createdAt, now),
    title: `${negotiation.club.name} contract offer`,
    organisation: negotiation.club.name,
    message: negotiation.notes?.trim() || null,
    meta: null,
    daysToReply: null,
    category: 'TRIALS',
    href: `/clubs/${negotiation.club.id}`,
  };
}

/** Oportunidad abierta con su porcentaje de encaje en el perfil. */
export function matchFromOpportunity(
  opportunity: OpportunityLike,
  match: number,
  now: Date = new Date()
): TransferMatch {
  return {
    id: opportunity.id,
    title: opportunity.title,
    organisation: organisationOf(opportunity),
    type: opportunityTypeLabel(opportunity.type),
    category: opportunityCategory(opportunity),
    match,
    location: opportunity.location,
    closesInDays: opportunity.closesAt ? daysUntil(opportunity.closesAt, now) : null,
    href: `/dashboard/player/opportunities/${opportunity.id}`,
  };
}

/** Candidatura ya enviada por el jugador. */
export function applicationFromRow(
  application: ApplicationLike,
  now: Date = new Date()
): TransferApplication {
  return {
    id: application.id,
    title: application.opportunity.title,
    organisation: organisationOf(application.opportunity),
    type: opportunityTypeLabel(application.opportunity.type),
    category: opportunityCategory(application.opportunity),
    status: application.status,
    daysAgo: daysSince(application.createdAt, now),
    href: `/dashboard/player/opportunities/${application.opportunity.id}`,
  };
}

/** Filtra por categoría; `ALL` devuelve una copia (nunca el array original). */
export function filterByCategory<T extends { category: ItemCategory }>(
  items: readonly T[],
  category: TransferCategory
): T[] {
  return category === 'ALL' ? [...items] : items.filter((item) => item.category === category);
}

/** Contadores del encabezado (siempre sobre el total, no sobre el filtro). */
export function transferWindowStats(input: {
  offers: readonly TransferOffer[];
  matches: readonly TransferMatch[];
  applications: readonly TransferApplication[];
}): TransferWindowStats {
  return {
    offersWaiting: input.offers.length,
    matches: input.matches.length,
    applications: input.applications.length,
  };
}
