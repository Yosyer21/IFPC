import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { CALENDAR_EVENT_LABELS, type CalendarEventKind } from '@ifpc/config';
import {
  CalendarView,
  type CalendarData,
  type CalendarEventData,
  type CalendarLegendItem,
} from '@/components/preview/calendar-view';
import {
  isSameMonth,
  listCalendarEvents,
  monthParam,
  parseMonthParam,
  shiftMonth,
  startOfMonth,
  type CalendarEvent,
} from '@/lib/calendar';

export const metadata: Metadata = { title: 'My calendar' };

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

const NOTE =
  'Sessions booked in “The 1% Factor” and trials accepted in the Transfer Window appear here automatically.';

function timeRange(event: CalendarEvent): string {
  const start = TIME_FORMAT.format(event.at);
  return event.endAt ? `${start} - ${TIME_FORMAT.format(event.endAt)}` : start;
}

export default async function PlayerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { month: monthQuery } = await searchParams;
  const month = parseMonthParam(monthQuery);
  const range = { from: startOfMonth(month), to: startOfMonth(shiftMonth(month, 1)) };

  const rawEvents = await listCalendarEvents(
    { id: session.user.id, role: String(session.user.role ?? 'PLAYER'), name: session.user.name ?? undefined },
    range
  );

  const events: CalendarEventData[] = rawEvents
    .filter((event) => isSameMonth(event.at, month))
    .map((event) => ({
      day: event.at.getUTCDate(),
      time: timeRange(event),
      title: event.title,
      sub: event.detail,
      kind: event.kind,
      label: CALENDAR_EVENT_LABELS[event.kind],
      href: event.href,
    }));

  const kinds = [...new Set(events.map((event) => event.kind))] as CalendarEventKind[];
  const legend: CalendarLegendItem[] = kinds.map((kind) => ({
    kind,
    label: CALENDAR_EVENT_LABELS[kind],
  }));

  const now = new Date();
  const todayDay = isSameMonth(now, month) ? now.getUTCDate() : undefined;

  const prevHref = `?month=${monthParam(shiftMonth(month, -1))}`;
  const nextHref = `?month=${monthParam(shiftMonth(month, 1))}`;

  const data: CalendarData = {
    year: month.getUTCFullYear(),
    monthIndex: month.getUTCMonth(),
    monthLabel: MONTH_FORMAT.format(month),
    todayDay,
    initialDay: todayDay ?? events[0]?.day ?? 1,
    events,
    legend,
    note: NOTE,
    monthNav: { prevHref, nextHref, todayHref: '/dashboard/player/calendar' },
  };

  return (
    <div className="mx-auto max-w-6xl">
      <CalendarView data={data} />
    </div>
  );
}
