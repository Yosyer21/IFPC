'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, Plus } from 'lucide-react';

export interface CalendarEventData {
  day: number;
  time: string;
  title: string;
  sub?: string | null;
  /** Clave de estilo (spec: Training/Match/…; real: live/room/trial/…). */
  kind: string;
  /** Texto de la insignia del evento. */
  label: string;
  /** Enlace de destino del evento (vista ya existente). */
  href?: string | null;
}

export interface CalendarLegendItem {
  kind: string;
  label: string;
}

export interface CalendarData {
  year: number;
  monthIndex: number;
  monthLabel: string;
  todayDay?: number;
  initialDay?: number;
  events: CalendarEventData[];
  legend: CalendarLegendItem[];
  note?: string;
  /** Si se pasa, el selector de mes muestra flechas ‹ › que navegan. */
  monthNav?: { prevHref?: string; nextHref?: string; todayHref?: string };
}

interface ToneStyle {
  dot: string;
  bg: string;
  badgeBg: string;
  badgeFg: string;
}

const STYLE: Record<string, ToneStyle> = {
  Training: { dot: '#84cc16', bg: '#ecfccb', badgeBg: '#d9f99d', badgeFg: '#3f6212' },
  Match: { dot: '#111111', bg: '#f3f4f6', badgeBg: '#e5e7eb', badgeFg: '#111111' },
  'Rookie session': { dot: '#38bdf8', bg: '#e0f2fe', badgeBg: '#bae6fd', badgeFg: '#075985' },
  Meeting: { dot: '#ef4444', bg: '#e0f2fe', badgeBg: '#bae6fd', badgeFg: '#075985' },
  live: { dot: '#84cc16', bg: '#ecfccb', badgeBg: '#d9f99d', badgeFg: '#3f6212' },
  room: { dot: '#38bdf8', bg: '#e0f2fe', badgeBg: '#bae6fd', badgeFg: '#075985' },
  trial: { dot: '#ef4444', bg: '#fee2e2', badgeBg: '#fecaca', badgeFg: '#991b1b' },
  camp: { dot: '#34d399', bg: '#d1fae5', badgeBg: '#a7f3d0', badgeFg: '#065f46' },
  deadline: { dot: '#f97316', bg: '#ffedd5', badgeBg: '#fed7aa', badgeFg: '#9a3412' },
  pathway: { dot: '#a78bfa', bg: '#ede9fe', badgeBg: '#ddd6fe', badgeFg: '#5b21b6' },
  goal: { dot: '#84cc16', bg: '#ecfccb', badgeBg: '#d9f99d', badgeFg: '#3f6212' },
};

const FALLBACK: ToneStyle = { dot: '#9aa0a6', bg: '#f3f4f6', badgeBg: '#e5e7eb', badgeFg: '#374151' };

function toneOf(kind: string): ToneStyle {
  return STYLE[kind] ?? FALLBACK;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEMO: CalendarData = {
  year: 2026,
  monthIndex: 9,
  monthLabel: 'October 2026',
  todayDay: 13,
  initialDay: 13,
  events: [
    { day: 8, time: '17:00 - 18:00', title: 'Team training', sub: 'U16 Girls · Riverside Park', kind: 'Training', label: 'Training' },
    { day: 13, time: '16:00 - 16:30', title: 'Video call: Coach Sam', sub: 'Parent included', kind: 'Meeting', label: 'Meeting' },
    { day: 13, time: '17:00 - 18:00', title: 'Team training', sub: 'U16 Girls · Riverside Park', kind: 'Training', label: 'Training' },
    { day: 16, time: '10:00 - 11:30', title: 'League match: City FC', sub: 'Away · League fixture', kind: 'Match', label: 'Match' },
    { day: 20, time: '18:00 - 19:00', title: 'Rookie session', sub: 'Ball mastery · Small group', kind: 'Rookie session', label: 'Rookie session' },
    { day: 27, time: '16:00 - 16:30', title: 'Trial debrief', sub: 'Coach + family', kind: 'Meeting', label: 'Meeting' },
  ],
  legend: [
    { kind: 'Training', label: 'Training' },
    { kind: 'Match', label: 'Match' },
    { kind: 'Rookie session', label: 'Rookie session' },
    { kind: 'Meeting', label: 'Meeting / Trial' },
  ],
  note: 'Sessions booked in “The 1% Factor” and trials accepted in the Transfer Window appear here automatically.',
};

export function CalendarView({ data = DEMO }: { data?: CalendarData }) {
  const { year, monthIndex, monthLabel, todayDay, events, legend, note, monthNav } = data;

  const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDay = new Map<number, CalendarEventData[]>();
  for (const event of events) {
    const list = eventsByDay.get(event.day) ?? [];
    list.push(event);
    eventsByDay.set(event.day, list);
  }

  const [selected, setSelected] = useState<number>(
    data.initialDay ?? todayDay ?? events[0]?.day ?? 1
  );
  const dayEvents = eventsByDay.get(selected) ?? [];
  const weekdayName = DAY_NAMES[(firstOffset + selected - 1) % 7];
  const headerLabel = todayDay === selected ? 'Today' : 'Selected day';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[#111] sm:text-4xl">My calendar</h1>
      </div>

      <div className="grid gap-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          {monthNav ? (
            <div className="mb-5 flex items-center gap-2">
              <Link
                href={monthNav.prevHref ?? '#'}
                aria-label="Previous month"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] text-lg text-[#374151] transition-colors hover:bg-[#f8f9fa]"
              >
                ‹
              </Link>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-3.5 py-2 text-sm font-semibold text-[#111]">
                <Calendar className="h-4 w-4 text-[#6b7280]" />
                {monthLabel}
              </span>
              <Link
                href={monthNav.nextHref ?? '#'}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] text-lg text-[#374151] transition-colors hover:bg-[#f8f9fa]"
              >
                ›
              </Link>
              {monthNav.todayHref ? (
                <Link
                  href={monthNav.todayHref}
                  className="ml-1 inline-flex h-9 items-center rounded-xl border border-[#e5e7eb] px-3 text-sm font-semibold text-[#111] transition-colors hover:bg-[#f8f9fa]"
                >
                  Today
                </Link>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-3.5 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#f8f9fa]"
            >
              <Calendar className="h-4 w-4 text-[#6b7280]" />
              {monthLabel}
              <ChevronDown className="h-4 w-4 text-[#9aa0a6]" />
            </button>
          )}

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="pb-2 text-[11px] font-semibold text-[#9aa0a6]">
                {day}
              </div>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <div key={`blank-${index}`} />;
              const evs = eventsByDay.get(day) ?? [];
              const isSelected = day === selected;
              const isToday = day === todayDay;
              return (
                <button key={day} type="button" onClick={() => setSelected(day)} className="flex flex-col items-center py-1">
                  <span
                    className={
                      isSelected
                        ? 'flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-sm font-semibold text-white'
                        : isToday
                          ? 'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-[#111] ring-2 ring-[#d1fc2a]'
                          : 'flex h-9 w-9 items-center justify-center rounded-full text-sm text-[#374151] transition-colors hover:bg-[#f1f2f4]'
                    }
                  >
                    {day}
                  </span>
                  <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                    {evs.slice(0, 3).map((event, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: toneOf(event.kind).dot }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {legend.map((item) => (
              <span key={item.kind} className="inline-flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: toneOf(item.kind).dot }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl border border-[#eef0f2] bg-[#fbfbfc] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa0a6]">{headerLabel}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-black leading-none text-[#111] text-5xl">{selected}</span>
                <span className="text-sm text-[#6b7280]">{weekdayName}</span>
              </div>
            </div>
            <span className="shrink-0 text-sm text-[#6b7280]">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {dayEvents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#e5e7eb] px-4 py-8 text-center text-sm text-[#9aa0a6]">
                No events scheduled for this day.
              </p>
            ) : (
              dayEvents.map((event, index) => {
                const style = toneOf(event.kind);
                return (
                  <div key={index} className="rounded-2xl p-4" style={{ backgroundColor: style.bg }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#374151]">{event.time}</p>
                        <p className="mt-1 text-sm font-black uppercase leading-tight text-[#111]">
                          {event.href ? (
                            <Link href={event.href} className="underline-offset-2 hover:underline">
                              {event.title}
                            </Link>
                          ) : (
                            event.title
                          )}
                        </p>
                        {event.sub ? <p className="mt-0.5 text-xs text-[#6b7280]">{event.sub}</p> : null}
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ backgroundColor: style.badgeBg, color: style.badgeFg }}
                      >
                        {event.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {note ? <p className="mt-5 text-[11px] leading-relaxed text-[#9aa0a6]">{note}</p> : null}

          <button
            type="button"
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#111] text-[#d1fc2a] shadow-lg transition-colors hover:bg-black"
            aria-label="Add event"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
