import { prisma, type Prisma } from '@ifpc/database';
import { CALENDAR_EVENT_LABELS, type CalendarEventKind } from '@ifpc/config';
import {
  CAMP_STATUS_LABELS,
  GOAL_STATUS_LABELS,
  LIVE_SESSION_STATUS_LABELS,
  LIVE_SESSION_TYPE_LABELS,
} from '@/lib/labels';
import { ACTIVE_CONTRACT_STATUSES } from '@/lib/training';
import { clubCoachIds, coachClubIds } from '@/lib/live-sessions';

/**
 * Calendario del sistema (solo lectura).
 *
 * No hay un modelo `CalendarEvent`: el calendario **agrega** lo que ya está
 * repartido por la plataforma y aplica el **mismo criterio de visibilidad** que
 * cada área, para no mostrar un enlace que el usuario no podría abrir. La parte
 * pura (rejilla de fechas, agrupado por día) vive aquí y está cubierta por
 * `tests/unit/calendar/`.
 *
 * Las fechas se manejan en **UTC**: es lo que ya hace la plataforma al anunciar
 * un live (`live-sessions.ts`) y así el render del servidor es determinista.
 */

/** Un evento listo para pintar en la rejilla. */
export interface CalendarEvent {
  /** Id estable y prefijado por tipo (`live-…`, `goal-…`): evita colisiones entre fuentes. */
  id: string;
  kind: CalendarEventKind;
  title: string;
  /** Línea de contexto (autor, tipo, motivo). `null` si no hay nada que añadir. */
  detail: string | null;
  at: Date;
  endAt: Date | null;
  /** Destino al hacer clic (la vista que ya existe). `null` = sin enlace. */
  href: string | null;
}

/** Quién mira el calendario (la sesión). */
export interface CalendarViewer {
  id: string;
  role: string;
  name?: string;
}

// ---------------------------------------------------------------------------
// Fechas (puras)
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;
/** 6 semanas × 7 días: la rejilla siempre tiene el mismo alto. */
export const CALENDAR_GRID_DAYS = 42;

/** Primer día del mes a las 00:00 UTC. */
export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Primer día del mes siguiente (límite superior exclusivo). */
export function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Medianoche UTC del día de `date`. */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Lunes de la semana de `date` (semana europea: lunes = primer día). */
export function startOfWeekMonday(date: Date): Date {
  const weekday = date.getUTCDay(); // 0 = domingo … 6 = sábado
  const offset = (weekday + 6) % 7; // 0 para lunes
  return addDays(startOfDay(date), -offset);
}

/** Las 42 casillas de la rejilla (con los días de los meses vecinos). */
export function buildMonthGrid(month: Date): Date[] {
  const first = startOfWeekMonday(startOfMonth(month));
  return Array.from({ length: CALENDAR_GRID_DAYS }, (_, index) => addDays(first, index));
}

/** Clave de día `YYYY-MM-DD` (UTC), la que usa el agrupado. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function isSameMonth(date: Date, month: Date): boolean {
  return date.getUTCFullYear() === month.getUTCFullYear() && date.getUTCMonth() === month.getUTCMonth();
}

export function isToday(date: Date, now: Date = new Date()): boolean {
  return isSameDay(date, now);
}

/** `YYYY-MM` del mes (para el parámetro `?month=`). */
export function monthParam(date: Date): string {
  return dayKey(date).slice(0, 7);
}

/**
 * Mes a partir de `?month=YYYY-MM`. Cualquier valor ausente o inválido cae al
 * mes de `fallback`: así un enlace manipulado nunca rompe la página.
 */
export function parseMonthParam(value: string | undefined, fallback: Date = new Date()): Date {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? '');
  if (!match) return startOfMonth(fallback);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

/** Mes desplazado `delta` meses (negativo = atrás). Siempre el día 1. */
export function shiftMonth(month: Date, delta: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1));
}

/**
 * Día a partir de `?day=YYYY-MM-DD`. Devuelve `null` si falta o no es una fecha
 * real (un `2026-02-31` normalizado por el motor también se rechaza), para que
 * un enlace manipulado no seleccione un día inventado.
 */
export function parseDayParam(value: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return dayKey(date) === value ? date : null;
}

/**
 * Qué día queda seleccionado (determinista y testeable):
 * 1. El que pida la URL, si es válido.
 * 2. Hoy, si hoy cae en el mes visible (lo más útil al abrir).
 * 3. El primer día del mes con eventos.
 * 4. El día 1.
 */
export function resolveSelectedDay(input: {
  requested?: string | null;
  month: Date;
  daysWithEvents: readonly string[];
  now?: Date;
}): Date {
  const requested = parseDayParam(input.requested ?? undefined);
  if (requested) return requested;

  const now = input.now ?? new Date();
  if (isSameMonth(now, input.month)) return startOfDay(now);

  const prefix = monthParam(input.month);
  const inMonth = input.daysWithEvents.filter((key) => key.startsWith(prefix)).sort();
  return parseDayParam(inMonth[0]) ?? startOfMonth(input.month);
}

/** Eventos que caen en ese día (comparando por clave `YYYY-MM-DD`, en UTC). */
export function eventsOnDay(events: readonly CalendarEvent[], day: Date): CalendarEvent[] {
  const key = dayKey(day);
  return events.filter((event) => dayKey(event.at) === key);
}

/** Agrupa por día (`YYYY-MM-DD`), ordenando cada día por hora. */
export function groupEventsByDay(events: readonly CalendarEvent[]): Map<string, CalendarEvent[]> {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(event.at);
    const list = byDay.get(key);
    if (list) list.push(event);
    else byDay.set(key, [event]);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.at.getTime() - b.at.getTime());
  }
  return byDay;
}

/** Eventos desde `now` (inclusive), ordenados, limitados a `limit`. */
export function upcomingEvents(
  events: readonly CalendarEvent[],
  now: Date = new Date(),
  limit = 8
): CalendarEvent[] {
  return events
    .filter((event) => event.at.getTime() >= now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, limit);
}

export function eventKindLabel(kind: CalendarEventKind): string {
  return CALENDAR_EVENT_LABELS[kind];
}

// ---------------------------------------------------------------------------
// Contexto del espectador (a quién sigue y a qué pertenece)
// ---------------------------------------------------------------------------

interface CalendarContext {
  role: string;
  playerId: string | null;
  coachId: string | null;
  clubId: string | null;
  universityId: string | null;
  /** Jugadores cuyos eventos ve (uno mismo, o los hijos de un familiar). */
  playerIds: string[];
  /** Coaches cuyos eventos ve. */
  coachIds: string[];
  /** Clubes cuyos eventos ve. */
  clubIds: string[];
  /** Solo para el rol PARENT: el enlace de desarrollo apunta a cada hijo. */
  childPlayerIds: string[];
  /** Jugadores representados (rol AGENT). */
  representedPlayerIds: string[];
}

function uniq(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/**
 * Resuelve, con una sola tanda de consultas, a quién pertenece el espectador.
 * Cada rol rellena solo lo que necesita; el resto queda vacío y sus `where`
 * resultantes no devuelven nada (no se inventan eventos).
 */
export async function loadCalendarContext(viewer: CalendarViewer): Promise<CalendarContext> {
  const role = viewer.role.toUpperCase();
  const [player, coach, club, university] = await Promise.all([
    prisma.player.findUnique({ where: { userId: viewer.id }, select: { id: true } }),
    prisma.coach.findUnique({ where: { userId: viewer.id }, select: { id: true } }),
    prisma.club.findUnique({ where: { userId: viewer.id }, select: { id: true } }),
    prisma.university.findUnique({ where: { userId: viewer.id }, select: { id: true } }),
  ]);

  const context: CalendarContext = {
    role,
    playerId: player?.id ?? null,
    coachId: coach?.id ?? null,
    clubId: club?.id ?? null,
    universityId: university?.id ?? null,
    playerIds: player ? [player.id] : [],
    coachIds: [],
    clubIds: [],
    childPlayerIds: [],
    representedPlayerIds: [],
  };

  if (role === 'PLAYER' && player) {
    const [links, contracts] = await Promise.all([
      prisma.coachPlayer.findMany({ where: { playerId: player.id }, select: { coachId: true } }),
      prisma.contract.findMany({
        where: { playerId: player.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
        select: { clubId: true },
      }),
    ]);
    context.coachIds = uniq(links.map((link) => link.coachId));
    context.clubIds = uniq(contracts.map((contract) => contract.clubId));
  }

  if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: viewer.id },
      select: { children: { select: { playerId: true } } },
    });
    const childIds = uniq(parent?.children.map((child) => child.playerId) ?? []);
    context.childPlayerIds = childIds;
    context.playerIds = childIds;
    if (childIds.length > 0) {
      const [links, contracts] = await Promise.all([
        prisma.coachPlayer.findMany({
          where: { playerId: { in: childIds } },
          select: { coachId: true },
        }),
        prisma.contract.findMany({
          where: { playerId: { in: childIds }, status: { in: ACTIVE_CONTRACT_STATUSES } },
          select: { clubId: true },
        }),
      ]);
      context.coachIds = uniq(links.map((link) => link.coachId));
      context.clubIds = uniq(contracts.map((contract) => contract.clubId));
    }
  }

  if (role === 'COACH' && coach) {
    const [clubs, links] = await Promise.all([
      coachClubIds(coach.id),
      prisma.coachPlayer.findMany({ where: { coachId: coach.id }, select: { playerId: true } }),
    ]);
    context.clubIds = uniq(clubs);
    context.playerIds = uniq(links.map((link) => link.playerId));
  }

  if (role === 'CLUB' && club) {
    const [coaches, contracts] = await Promise.all([
      clubCoachIds(club.id),
      prisma.contract.findMany({
        where: { clubId: club.id, status: { in: ACTIVE_CONTRACT_STATUSES } },
        select: { playerId: true },
      }),
    ]);
    context.coachIds = uniq(coaches);
    context.playerIds = uniq(contracts.map((contract) => contract.playerId));
  }

  if (role === 'AGENT') {
    const agent = await prisma.agent.findUnique({
      where: { userId: viewer.id },
      select: { players: { select: { playerId: true } } },
    });
    context.representedPlayerIds = uniq(agent?.players.map((row) => row.playerId) ?? []);
  }

  return context;
}

// ---------------------------------------------------------------------------
// Consultas: cada fuente aplica el mismo criterio de visibilidad que su área
// ---------------------------------------------------------------------------

/** Tope de filas por fuente: el calendario es una vista, no un export. */
const SOURCE_LIMIT = 300;

export interface CalendarRange {
  /** Inclusive. */
  from: Date;
  /** Exclusivo. */
  to: Date;
}

/** Live sessions visibles: pública, del club, del coach o personal (1:1). */
function liveWhere(
  context: CalendarContext,
  range: CalendarRange
): Prisma.LiveSessionWhereInput | null {
  const inRange: Prisma.LiveSessionWhereInput = { startsAt: { gte: range.from, lt: range.to } };
  if (context.role === 'ADMIN') return inRange;

  const or: Prisma.LiveSessionWhereInput[] = [{ visibility: 'PUBLIC' }];
  if (context.role === 'CLUB') {
    if (context.clubId) or.push({ clubId: context.clubId });
    if (context.coachIds.length > 0) or.push({ coachId: { in: context.coachIds } });
  } else if (context.role === 'COACH') {
    if (context.coachId) or.push({ coachId: context.coachId });
    if (context.clubIds.length > 0) or.push({ clubId: { in: context.clubIds } });
  } else if (context.playerIds.length > 0) {
    or.push({ playerId: { in: context.playerIds } });
    if (context.coachIds.length > 0) or.push({ coachId: { in: context.coachIds } });
    if (context.clubIds.length > 0) or.push({ clubId: { in: context.clubIds } });
  }

  return { AND: [inRange, { OR: or }] };
}

/** Salas de vídeo: las que ese usuario abre o a las que está invitado. */
function roomWhere(
  context: CalendarContext,
  range: CalendarRange
): Prisma.TrainingRoomWhereInput | null {
  const inRange: Prisma.TrainingRoomWhereInput = { startsAt: { gte: range.from, lt: range.to } };
  if (context.role === 'ADMIN') return inRange;

  const or: Prisma.TrainingRoomWhereInput[] = [];
  if (context.coachId) or.push({ coachId: context.coachId });
  if (context.clubId) or.push({ clubId: context.clubId });
  if (context.playerIds.length > 0) {
    or.push({ targets: { some: { playerId: { in: context.playerIds } } } });
  }
  if (context.coachIds.length > 0) {
    or.push({ coachId: { in: context.coachIds }, scope: 'AUDIENCE' });
  }
  if (context.clubIds.length > 0) {
    or.push({ clubId: { in: context.clubIds }, scope: 'AUDIENCE' });
  }
  if (or.length === 0) return null;

  return { AND: [inRange, { OR: or }] };
}

/** Pruebas (trials): del club, del jugador o de un jugador representado. */
function trialWhere(
  context: CalendarContext,
  range: CalendarRange
): Prisma.TrialWhereInput | null {
  const inRange: Prisma.TrialWhereInput = { startsAt: { gte: range.from, lt: range.to } };
  if (context.role === 'ADMIN') return inRange;
  if (context.role === 'CLUB' && context.clubId) {
    return { AND: [inRange, { clubId: context.clubId }] };
  }
  if (context.representedPlayerIds.length > 0) {
    return { AND: [inRange, { playerId: { in: context.representedPlayerIds } }] };
  }
  if (context.playerIds.length > 0) {
    return { AND: [inRange, { playerId: { in: context.playerIds } }] };
  }
  return null;
}

/** Campamentos: los abiertos son públicos; el club/coach también ve los suyos. */
function campWhere(context: CalendarContext, range: CalendarRange): Prisma.CampWhereInput {
  const inRange: Prisma.CampWhereInput = { startsAt: { gte: range.from, lt: range.to } };
  if (context.role === 'ADMIN') return inRange;

  const or: Prisma.CampWhereInput[] = [{ status: 'OPEN' }, { status: 'FULL' }];
  if (context.clubId) or.push({ clubId: context.clubId });
  if (context.coachId) or.push({ coachId: context.coachId });
  return { AND: [inRange, { OR: or }] };
}

/** Cierre de convocatoria (`Opportunity.closesAt`). */
function deadlineWhere(
  context: CalendarContext,
  range: CalendarRange
): Prisma.OpportunityWhereInput | null {
  const inRange: Prisma.OpportunityWhereInput = { closesAt: { gte: range.from, lt: range.to } };
  switch (context.role) {
    case 'ADMIN':
      return inRange;
    case 'CLUB':
      return context.clubId ? { AND: [inRange, { clubId: context.clubId }] } : null;
    case 'UNIVERSITY':
      return context.universityId ? { AND: [inRange, { universityId: context.universityId }] } : null;
    case 'PLAYER':
    case 'PARENT':
      if (context.playerIds.length === 0) return null;
      return {
        AND: [
          inRange,
          {
            OR: [
              { applications: { some: { playerId: { in: context.playerIds } } } },
              { savedBy: { some: { playerId: { in: context.playerIds } } } },
            ],
          },
        ],
      };
    default:
      return { AND: [inRange, { status: 'OPEN' }] };
  }
}

/** Área de oportunidades de cada rol (para enlazar un cierre de convocatoria). */
const OPPORTUNITY_AREA: Record<string, string> = {
  PLAYER: '/dashboard/player/opportunities',
  PARENT: '/dashboard/parent/opportunities',
  CLUB: '/dashboard/club/opportunities',
  UNIVERSITY: '/dashboard/university/opportunities',
  SCOUT: '/dashboard/scout/opportunities',
  AGENT: '/dashboard/agent/opportunities',
  SCHOOL: '/dashboard/school/opportunities',
  ADMIN: '/dashboard/admin/opportunities',
};

function joinDetail(parts: readonly (string | null | undefined)[]): string | null {
  const text = parts.filter((part): part is string => Boolean(part)).join(' · ');
  return text.length > 0 ? text : null;
}

async function liveSessionEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const where = liveWhere(context, range);
  if (!where) return [];

  const rows = await prisma.liveSession.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: SOURCE_LIMIT,
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      endsAt: true,
      visibility: true,
      club: { select: { name: true } },
      coach: { select: { user: { select: { name: true } } } },
    },
  });

  return rows.map((row) => ({
    id: `live-${row.id}`,
    kind: 'live' as const,
    title: row.title,
    detail: joinDetail([
      LIVE_SESSION_TYPE_LABELS[row.type] ?? row.type,
      row.club?.name ?? row.coach?.user?.name ?? (row.visibility === 'PUBLIC' ? 'Public' : null),
    ]),
    at: row.startsAt,
    endAt: row.endsAt,
    href: `/dashboard/live-sessions/${row.id}`,
  }));
}

async function roomEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const where = roomWhere(context, range);
  if (!where) return [];

  const rows = await prisma.trainingRoom.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: SOURCE_LIMIT,
    select: { id: true, title: true, status: true, startsAt: true, endsAt: true, joinCode: true },
  });

  return rows.map((row) => ({
    id: `room-${row.id}`,
    kind: 'room' as const,
    title: row.title,
    detail: LIVE_SESSION_STATUS_LABELS[row.status] ?? row.status,
    at: row.startsAt,
    endAt: row.endsAt,
    href: `/dashboard/rooms/${row.joinCode}`,
  }));
}

async function trialEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const where = trialWhere(context, range);
  if (!where) return [];

  const rows = await prisma.trial.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: SOURCE_LIMIT,
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      location: true,
      club: { select: { name: true } },
      player: { select: { firstName: true, lastName: true } },
    },
  });

  const href =
    context.role === 'ADMIN'
      ? '/dashboard/admin/recruitment/trials'
      : context.role === 'AGENT'
        ? '/dashboard/agent/trials'
        : null;

  return rows.map((row) => ({
    id: `trial-${row.id}`,
    kind: 'trial' as const,
    title: `Trial · ${(row.player.firstName ?? '').trim()} ${(row.player.lastName ?? '').trim()}`.trim(),
    detail: joinDetail([row.club?.name, row.location]),
    at: row.startsAt,
    endAt: row.endsAt,
    href,
  }));
}

async function campEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const rows = await prisma.camp.findMany({
    where: campWhere(context, range),
    orderBy: { startsAt: 'asc' },
    take: SOURCE_LIMIT,
    select: { id: true, title: true, status: true, city: true, country: true, startsAt: true, endsAt: true },
  });

  return rows.map((row) => ({
    id: `camp-${row.id}`,
    kind: 'camp' as const,
    title: row.title,
    detail: joinDetail([
      CAMP_STATUS_LABELS[row.status] ?? row.status,
      [row.city, row.country].filter(Boolean).join(', ') || null,
    ]),
    at: row.startsAt,
    endAt: row.endsAt,
    href: `/camps/${row.id}`,
  }));
}

async function deadlineEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const where = deadlineWhere(context, range);
  if (!where) return [];

  const rows = await prisma.opportunity.findMany({
    where,
    orderBy: { closesAt: 'asc' },
    take: SOURCE_LIMIT,
    select: {
      id: true,
      title: true,
      closesAt: true,
      club: { select: { name: true } },
      university: { select: { name: true } },
    },
  });

  const base = OPPORTUNITY_AREA[context.role] ?? '/opportunities';
  const withDetail = context.role === 'PLAYER' || context.role === 'ADMIN';

  return rows.flatMap((row) =>
    row.closesAt
      ? [
          {
            id: `deadline-${row.id}`,
            kind: 'deadline' as const,
            title: row.title,
            detail: joinDetail([
              'Closes',
              row.club?.name ?? row.university?.name ?? 'Open opportunity',
            ]),
            at: row.closesAt,
            endAt: null,
            href: withDetail ? `${base}/${row.id}` : base,
          },
        ]
      : []
  );
}

/** Enlace del desarrollo: el familiar va al hijo; el jugador, a su área. */
function developmentHref(
  context: CalendarContext,
  playerId: string,
  kind: 'goal' | 'pathway'
): string {
  if (context.role === 'PARENT') return `/dashboard/parent/children/${playerId}/development`;
  return kind === 'goal'
    ? '/dashboard/player/development/goals'
    : '/dashboard/player/pathway';
}

/**
 * Fases de la ruta (pathway) y metas con fecha: son datos privados del jugador,
 * así que solo entran para el propio jugador y sus familiares.
 */
async function developmentEvents(
  context: CalendarContext,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  if (context.playerIds.length === 0) return [];
  if (context.role !== 'PLAYER' && context.role !== 'PARENT') return [];

  const [pathways, goals] = await Promise.all([
    prisma.pathway.findMany({
      where: {
        playerId: { in: context.playerIds },
        OR: [
          { startsAt: { gte: range.from, lt: range.to } },
          { endsAt: { gte: range.from, lt: range.to } },
        ],
      },
      take: SOURCE_LIMIT,
      select: { id: true, title: true, startsAt: true, endsAt: true, status: true, playerId: true },
    }),
    prisma.playerGoal.findMany({
      where: {
        playerId: { in: context.playerIds },
        dueDate: { gte: range.from, lt: range.to },
        status: { not: 'completed' },
      },
      orderBy: { dueDate: 'asc' },
      take: SOURCE_LIMIT,
      select: { id: true, title: true, dueDate: true, status: true, playerId: true },
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const row of pathways) {
    const at = row.startsAt ?? row.endsAt;
    if (!at || !row.playerId) continue;
    events.push({
      id: `pathway-${row.id}`,
      kind: 'pathway',
      title: row.title,
      detail: row.status,
      at,
      endAt: row.endsAt,
      href: developmentHref(context, row.playerId, 'pathway'),
    });
  }

  for (const row of goals) {
    if (!row.dueDate) continue;
    events.push({
      id: `goal-${row.id}`,
      kind: 'goal',
      title: row.title,
      detail: joinDetail(['Due', GOAL_STATUS_LABELS[row.status] ?? row.status]),
      at: row.dueDate,
      endAt: null,
      href: developmentHref(context, row.playerId, 'goal'),
    });
  }

  return events;
}

/**
 * Todos los eventos del rango, agregando las fuentes en paralelo y ordenando por
 * fecha. Es la única entrada que usa la página.
 */
export async function listCalendarEvents(
  viewer: CalendarViewer,
  range: CalendarRange
): Promise<CalendarEvent[]> {
  const context = await loadCalendarContext(viewer);
  const groups = await Promise.all([
    liveSessionEvents(context, range),
    roomEvents(context, range),
    trialEvents(context, range),
    campEvents(context, range),
    deadlineEvents(context, range),
    developmentEvents(context, range),
  ]);

  return groups.flat().sort((a, b) => a.at.getTime() - b.at.getTime());
}
