import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  CALENDAR_EVENT_LABELS,
  CALENDAR_WEEKDAY_LABELS,
  type CalendarEventKind,
} from '@ifpc/config';
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

/**
 * Paleta del calendario: la **misma identidad de la app**. El color va en el
 * punto de la leyenda y en los puntos de actividad de cada día.
 */

/** Punto de la leyenda y de la rejilla compacta (móvil). */
const DOTS: Record<CalendarEventKind, string> = {
  live: 'bg-brand',
  room: 'bg-cyan-400',
  trial: 'bg-amber-400',
  camp: 'bg-emerald-400',
  deadline: 'bg-red-400',
  pathway: 'bg-violet-400',
  goal: 'bg-lime-300',
  booking: 'bg-fuchsia-400',
  meeting: 'bg-blue-400',
  match: 'bg-zinc-400',
  training: 'bg-emerald-400',
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

function hrefFor(basePath: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
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
  return (
    <div
      className={`animate-fade-up group relative flex min-h-[64px] flex-col items-center rounded-2xl pb-1 transition-colors ${
        inMonth ? '' : 'opacity-40'
      }`}
      style={{ animationDelay: `${Math.min(index * 8, 340)}ms` }}
    >
      {/* Día como esfera (número redondo), no como tarjeta cuadrada. */}
      <Link
        href={href}
        aria-current={selected ? 'date' : undefined}
        aria-label={`${FULL_DAY_FORMAT.format(day)}: ${events.length} event${
          events.length === 1 ? '' : 's'
        }`}
        className="flex flex-col items-center gap-1 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-all sm:text-sm ${
            selected
              ? 'bg-ink text-white shadow-sm ring-2 ring-brand'
              : today
                ? 'bg-brand/10 text-foreground ring-2 ring-brand'
                : 'bg-card text-foreground shadow-sm ring-1 ring-border/70 group-hover:bg-muted group-hover:text-foreground'
          }`}
        >
          {day.getUTCDate()}
        </span>

        {/* Puntos de actividad bajo la esfera (también en escritorio): los
            eventos completos viven en “Next up” y en el detalle del día. */}
        <span className="flex h-1.5 items-center gap-0.5">
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
    </div>
  );
}

export interface CalendarScreenProps {
  viewer: { id: string; role: string; name?: string };
  monthValue?: string;
  dayValue?: string;
  /** Ruta base de los enlaces de mes/día. Cambia según el rol (player usa la suya). */
  basePath?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Calendario único de la plataforma (player, club, coach, parent y resto de
 * roles): misma rejilla, mismas fichas y mismos controles. Solo cambia el
 * conjunto de eventos que devuelve `listCalendarEvents` según quién mira.
 */
export async function CalendarScreen({
  viewer,
  monthValue,
  dayValue,
  basePath = '/dashboard/calendar',
  title = 'Calendar',
  subtitle = 'Live sessions, rooms, trials, camps, deadlines and your development',
}: CalendarScreenProps) {
  const month = parseMonthParam(monthValue);
  const days = buildMonthGrid(month);
  const firstDay = days[0] ?? month;
  const range = { from: firstDay, to: addDays(firstDay, CALENDAR_GRID_DAYS) };

  const events = await listCalendarEvents(
    { id: viewer.id, role: viewer.role, name: viewer.name ?? '' },
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
    `${hrefFor(basePath, { month: monthParam(day), day: dayKey(day) })}#selected-day`;

  // Resumen del mes visible (solo los días del mes, no los de la rejilla).
  const monthEvents = events.filter((event) => isSameMonth(event.at, month));
  const summary = KIND_ORDER.map((kind) => ({
    kind,
    count: monthEvents.filter((event) => event.kind === kind).length,
  })).filter((row) => row.count > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} subtitle={subtitle} icon="calendar" />

      {/* Barra del mes: navegación a un toque, también en móvil. */}
      <Card className="animate-fade-up mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold capitalize">
              {MONTH_FORMAT.format(month)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {monthEvents.length === 0
                ? 'Nothing scheduled this month'
                : `${monthEvents.length} event${monthEvents.length === 1 ? '' : 's'} this month`}
            </p>
          </div>
          <nav className="flex items-center gap-2" aria-label="Month navigation">
            <Link
              href={hrefFor(basePath, { month: previous })}
              className={NAV_BUTTON}
              aria-label="Previous month"
            >
              <IconChevronDown className="h-4 w-4 rotate-90" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
            <Link href={hrefFor(basePath, {})} className={TODAY_BUTTON}>
              Today
            </Link>
            <Link
              href={hrefFor(basePath, { month: next })}
              className={NAV_BUTTON}
              aria-label="Next month"
            >
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
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-brand/30 hover:text-foreground"
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
          <div className="animate-fade-up px-1">
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
          </div>

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
