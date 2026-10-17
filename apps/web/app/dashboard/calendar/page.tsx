import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { CALENDAR_EVENT_LABELS, CALENDAR_WEEKDAY_LABELS, type CalendarEventKind } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { IconCalendar, IconChevronDown } from '@/components/dashboard/icons';
import {
  addDays,
  buildMonthGrid,
  CALENDAR_GRID_DAYS,
  dayKey,
  eventsOnDay,
  groupEventsByDay,
  isSameDay,
  isSameMonth,
  isToday,
  listCalendarEvents,
  monthParam,
  parseMonthParam,
  resolveSelectedDay,
  shiftMonth,
  upcomingEvents,
  type CalendarEvent,
} from '@/lib/calendar';

export const metadata: Metadata = { title: 'Calendar' };

/**
 * Paleta del calendario: la **misma identidad de la app** (lima de marca en
 * `border-l-brand` + las familias que ya usa el dashboard: emerald, amber, red y
 * cyan). El color va en el **filete izquierdo** y en el punto de la leyenda; el
 * cuerpo de la ficha es neutro para que el texto se lea siempre igual.
 */
const TONES: Record<CalendarEventKind, string> = {
  live: 'border-l-brand bg-brand/20 hover:bg-brand/30',
  room: 'border-l-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30',
  trial: 'border-l-amber-400 bg-amber-500/20 hover:bg-amber-500/30',
  camp: 'border-l-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30',
  deadline: 'border-l-red-400 bg-red-500/20 hover:bg-red-500/30',
  pathway: 'border-l-violet-400 bg-violet-500/20 hover:bg-violet-500/30',
  goal: 'border-l-lime-300 bg-lime-400/20 hover:bg-lime-400/30',
};

/** Punto de la leyenda y de la rejilla compacta (móvil). */
const DOTS: Record<CalendarEventKind, string> = {
  live: 'bg-brand',
  room: 'bg-cyan-400',
  trial: 'bg-amber-400',
  camp: 'bg-emerald-400',
  deadline: 'bg-red-400',
  pathway: 'bg-violet-400',
  goal: 'bg-lime-300',
};

const KIND_ORDER = Object.keys(CALENDAR_EVENT_LABELS) as CalendarEventKind[];

const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** Título del día seleccionado («Friday 16 October»). */
const FULL_DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** Botón de navegación del mes (mismo tratamiento que los controles del área). */
const NAV_BUTTON =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** «Today»: acento de marca con el chip de gradiente (sin `text-*` que compita). */
const TODAY_BUTTON =
  'chip-gradient inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function hrefFor(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `/dashboard/calendar?${qs}` : '/dashboard/calendar';
}

/** Ficha de un evento: enlace si tiene destino, etiqueta si no. */
function EventChip({ event, delay = 0 }: { event: CalendarEvent; delay?: number }) {
  const className = `animate-fade-up flex w-full items-center gap-1 overflow-hidden rounded-md border border-transparent border-l-2 px-1.5 py-[3px] text-left text-[11px] leading-none text-foreground transition-all hover:translate-x-0.5 sm:text-xs ${TONES[event.kind]}`;
  const body = (
    <>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[event.kind]}`} />
      <span className="min-w-0 flex-1 truncate font-medium">{event.title}</span>
      <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
        {TIME_FORMAT.format(event.at)}
      </span>
    </>
  );

  if (!event.href) {
    return (
      <span className={className} style={{ animationDelay: `${delay}ms` }} title={event.detail ?? undefined}>
        {body}
      </span>
    );
  }
  return (
    <Link
      href={event.href}
      className={className}
      style={{ animationDelay: `${delay}ms` }}
      title={event.detail ?? undefined}
    >
      {body}
    </Link>
  );
}

/**
 * Fila de un evento: la usan el día seleccionado y «Next up». En el detalle del
 * día no se repite la fecha (todos los eventos son del mismo día).
 */
function EventRow({
  event,
  delay = 0,
  showDate = true,
}: {
  event: CalendarEvent;
  delay?: number;
  showDate?: boolean;
}) {
  return (
    <li
      className="animate-fade-up flex items-start gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOTS[event.kind]}`} />
      <div className="min-w-0 flex-1">
        {event.href ? (
          <Link
            href={event.href}
            className="block truncate text-sm font-medium transition-colors hover:text-brand"
          >
            {event.title}
          </Link>
        ) : (
          <span className="block truncate text-sm font-medium">{event.title}</span>
        )}
        <span className="block text-[11px] text-muted-foreground">
          {showDate ? `${DAY_FORMAT.format(event.at)} · ` : ''}
          {TIME_FORMAT.format(event.at)} UTC
        </span>
        <span className="block truncate text-[11px] text-subtle">
          {CALENDAR_EVENT_LABELS[event.kind]}
          {event.detail ? ` · ${event.detail}` : ''}
        </span>
      </div>
    </li>
  );
}

/**
 * Casilla de un día, **seleccionable**: al pulsarla se abre el detalle de ese día
 * justo debajo de la rejilla. Es lo que hace usable el calendario en el móvil,
 * donde solo caben puntos y no se distingue qué hay cada día.
 *
 * La estructura respeta el ancho y el HTML válido: el **día** (con los puntos en
 * móvil) es un enlace, y las **fichas** de escritorio son enlaces aparte, fuera
 * de él (un enlace no puede contener otro enlace).
 */
function DayCell({
  day,
  href,
  inMonth,
  today,
  selected,
  events,
  index,
}: {
  day: Date;
  href: string;
  inMonth: boolean;
  today: boolean;
  selected: boolean;
  events: CalendarEvent[];
  index: number;
}) {
  const hidden = events.slice(3);

  return (
    <div
      className={`animate-fade-up group relative flex min-h-[64px] flex-col overflow-hidden rounded-lg border transition-colors sm:min-h-[100px] ${
        inMonth ? 'border-border' : 'border-transparent opacity-40'
      } ${
        selected
          ? 'border-brand/60 bg-brand/15 ring-1 ring-brand/50'
          : today
            ? 'border-brand/30 bg-brand/10'
            : 'bg-white/[0.02] hover:border-brand/30 hover:bg-white/[0.05]'
      }`}
      style={{ animationDelay: `${Math.min(index * 8, 340)}ms` }}
    >
      {/* Toda la casilla selecciona el día (en móvil, puntos incluidos). */}
      <Link
        href={href}
        aria-current={selected ? 'date' : undefined}
        aria-label={`${FULL_DAY_FORMAT.format(day)}: ${events.length} event${
          events.length === 1 ? '' : 's'
        }`}
        className="flex flex-1 flex-col rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:p-1.5"
      >
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold ${
            today || selected ? 'text-brand' : 'text-muted-foreground'
          }`}
        >
          {day.getUTCDate()}
          {today ? <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-brand" /> : null}
        </span>

        {/* Móvil: puntos de actividad. */}
        <span className="mt-1 flex flex-wrap items-center gap-0.5 sm:hidden">
          {events.slice(0, 5).map((event) => (
            <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${DOTS[event.kind]}`} />
          ))}
          {events.length > 5 ? (
            <span className="text-[9px] leading-none text-muted-foreground">
              +{events.length - 5}
            </span>
          ) : null}
        </span>
      </Link>

      {/* Desde `sm`: fichas con título. */}
      <div className="hidden flex-col gap-1 px-1 pb-1 sm:flex sm:px-1.5 sm:pb-1.5">
        {events.slice(0, 3).map((event, chipIndex) => (
          <EventChip key={event.id} event={event} delay={chipIndex * 40} />
        ))}
        {hidden.length > 0 ? (
          <span
            className="px-1 text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-brand"
            title={hidden.map((event) => event.title).join(' · ')}
          >
            +{hidden.length} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { month: monthValue, day: dayValue } = await searchParams;
  const month = parseMonthParam(monthValue);
  const days = buildMonthGrid(month);
  const firstDay = days[0] ?? month;
  const range = { from: firstDay, to: addDays(firstDay, CALENDAR_GRID_DAYS) };

  const events = await listCalendarEvents(
    { id: session.user.id, role: session.user.role, name: session.user.name ?? '' },
    range
  );

  const byDay = groupEventsByDay(events);
  const now = new Date();
  const upcoming = upcomingEvents(events, now, 6);
  const previous = monthParam(shiftMonth(month, -1));
  const next = monthParam(shiftMonth(month, 1));

  // Día seleccionable: su detalle va debajo de la rejilla y es lo que hace el
  // calendario legible en el móvil (en las casillas solo caben puntos). El enlace
  // lleva `#selected-day` para que al elegir un día la vista baje al detalle.
  const selectedDay = resolveSelectedDay({
    requested: dayValue,
    month,
    daysWithEvents: [...byDay.keys()],
    now,
  });
  const selectedEvents = eventsOnDay(events, selectedDay);
  const selectedIsToday = isSameDay(selectedDay, now);
  const dayHref = (day: Date) =>
    `${hrefFor({ month: monthParam(day), day: dayKey(day) })}#selected-day`;

  // Resumen del mes visible (solo los días del mes, no los de la rejilla).
  const monthEvents = events.filter((event) => isSameMonth(event.at, month));
  const summary = KIND_ORDER.map((kind) => ({
    kind,
    count: monthEvents.filter((event) => event.kind === kind).length,
  })).filter((row) => row.count > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendar"
        subtitle="Live sessions, rooms, trials, camps, deadlines and your development"
        icon="calendar"
      />

      {/* Barra del mes: navegación a un toque, también en móvil. */}
      <Card className="animate-fade-up mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold capitalize">{MONTH_FORMAT.format(month)}</h2>
            <p className="text-xs text-muted-foreground">
              {monthEvents.length === 0
                ? 'Nothing scheduled this month'
                : `${monthEvents.length} event${monthEvents.length === 1 ? '' : 's'} this month`}
            </p>
          </div>
          <nav className="flex items-center gap-2" aria-label="Month navigation">
            <Link
              href={hrefFor({ month: previous })}
              className={NAV_BUTTON}
              aria-label="Previous month"
            >
              <IconChevronDown className="h-4 w-4 rotate-90" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
            <Link href={hrefFor({})} className={TODAY_BUTTON}>
              Today
            </Link>
            <Link href={hrefFor({ month: next })} className={NAV_BUTTON} aria-label="Next month">
              <span className="hidden sm:inline">Next</span>
              <IconChevronDown className="h-4 w-4 -rotate-90" />
            </Link>
          </nav>
        </CardContent>
      </Card>

      {/* Leyenda: misma paleta que las fichas. */}
      <div className="animate-fade-up-slow mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {KIND_ORDER.map((kind) => (
          <span
            key={kind}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/[0.02] px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-brand/30 hover:text-foreground"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${DOTS[kind]}`} />
            {CALENDAR_EVENT_LABELS[kind]}
          </span>
        ))}
      </div>

      {/* Dos columnas en escritorio (rejilla + agenda), apiladas en móvil. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Columna izquierda: la rejilla y, justo debajo, el detalle del día. */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="animate-fade-up">
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {CALENDAR_WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="py-1">
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <DayCell
                    key={dayKey(day)}
                    day={day}
                    href={dayHref(day)}
                    inMonth={isSameMonth(day, month)}
                    today={isToday(day, now)}
                    selected={isSameDay(day, selectedDay)}
                    events={byDay.get(dayKey(day)) ?? []}
                    index={index}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalle del día elegido: resuelve la falta de información en móvil. */}
          <Card
            id="selected-day"
            className="animate-fade-up scroll-mt-20"
            style={{ animationDelay: '60ms' }}
          >
            <CardContent>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <span className="chip-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <IconCalendar className="h-3.5 w-3.5" />
                  </span>
                  {FULL_DAY_FORMAT.format(selectedDay)}
                </h2>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedIsToday ? <Badge variant="success">Today</Badge> : null}
                  {selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'}
                </span>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing scheduled this day. Tap another day in the grid.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selectedEvents.map((event, index) => (
                    <EventRow key={event.id} event={event} delay={index * 60} showDate={false} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="animate-scale-in">
            <CardContent>
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <span className="chip-gradient flex h-7 w-7 items-center justify-center rounded-lg">
                  <IconChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </span>
                Next up
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing from today. Jump to another month to see what is planned.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {upcoming.map((event, index) => (
                    <EventRow key={event.id} event={event} delay={index * 60} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <CardContent>
              <h2 className="mb-3 font-semibold">This month</h2>
              {summary.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events registered in this month.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {summary.map(({ kind, count }) => (
                    <li key={kind} className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${DOTS[kind]}`} />
                        {CALENDAR_EVENT_LABELS[kind]}
                      </span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
