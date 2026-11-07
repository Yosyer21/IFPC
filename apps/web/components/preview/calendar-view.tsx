'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, Plus } from 'lucide-react';

type EvType = 'Training' | 'Match' | 'Rookie session' | 'Meeting';

interface Ev {
  type: EvType;
  time: string;
  title: string;
  sub: string;
}

const YEAR = 2026;
const MONTH = 9; // 0-based → October
const MONTH_LABEL = 'October 2026';
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Oct 1 2026 is a Thursday → Monday-first offset = 3.
const FIRST_OFFSET = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7;
const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate();

const DOT: Record<EvType, string> = {
  Training: '#84cc16',
  Match: '#111111',
  'Rookie session': '#38bdf8',
  Meeting: '#ef4444',
};

const CARD: Record<EvType, { bg: string; badgeBg: string; badgeFg: string }> = {
  Meeting: { bg: '#e0f2fe', badgeBg: '#bae6fd', badgeFg: '#075985' },
  Training: { bg: '#ecfccb', badgeBg: '#d9f99d', badgeFg: '#3f6212' },
  Match: { bg: '#f3f4f6', badgeBg: '#e5e7eb', badgeFg: '#111111' },
  'Rookie session': { bg: '#e0f2fe', badgeBg: '#bae6fd', badgeFg: '#075985' },
};

const EVENTS: Record<number, Ev[]> = {
  8: [{ type: 'Training', time: '17:00 - 18:00', title: 'Team training', sub: 'U16 Girls · Riverside Park' }],
  13: [
    { type: 'Meeting', time: '16:00 - 16:30', title: 'Video call: Coach Sam', sub: 'Parent included' },
    { type: 'Training', time: '17:00 - 18:00', title: 'Team training', sub: 'U16 Girls · Riverside Park' },
  ],
  16: [{ type: 'Match', time: '10:00 - 11:30', title: 'League match: City FC', sub: 'Away · League fixture' }],
  20: [{ type: 'Rookie session', time: '18:00 - 19:00', title: 'Rookie session', sub: 'Ball mastery · Small group' }],
  27: [{ type: 'Meeting', time: '16:00 - 16:30', title: 'Trial debrief', sub: 'Coach + family' }],
};

const CELLS: (number | null)[] = [
  ...Array.from({ length: FIRST_OFFSET }, () => null),
  ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
];

export function CalendarView() {
  const [selected, setSelected] = useState(13);
  const events = EVENTS[selected] ?? [];
  const weekdayName = DAY_NAMES[(FIRST_OFFSET + selected - 1) % 7];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[#111] sm:text-4xl">My calendar</h1>
      </div>

      <div className="grid gap-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Monthly calendar */}
        <div>
          <button
            type="button"
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] px-3.5 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-[#f8f9fa]"
          >
            <Calendar className="h-4 w-4 text-[#6b7280]" />
            {MONTH_LABEL}
            <ChevronDown className="h-4 w-4 text-[#9aa0a6]" />
          </button>

          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="pb-2 text-[11px] font-semibold text-[#9aa0a6]">
                {day}
              </div>
            ))}
            {CELLS.map((day, index) => {
              if (day === null) return <div key={`blank-${index}`} />;
              const evs = EVENTS[day] ?? [];
              const isSelected = day === selected;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(day)}
                  className="flex flex-col items-center py-1"
                >
                  <span
                    className={
                      isSelected
                        ? 'flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-sm font-semibold text-white'
                        : 'flex h-9 w-9 items-center justify-center rounded-full text-sm text-[#374151] transition-colors hover:bg-[#f1f2f4]'
                    }
                  >
                    {day}
                  </span>
                  <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                    {evs.slice(0, 3).map((event, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: DOT[event.type] }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {(['Training', 'Match', 'Rookie session', 'Meeting'] as EvType[]).map((type) => (
              <span key={type} className="inline-flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOT[type] }} />
                {type === 'Meeting' ? 'Meeting / Trial' : type}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail */}
        <div className="relative rounded-2xl border border-[#eef0f2] bg-[#fbfbfc] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa0a6]">Today</p>
              <div className="flex items-baseline gap-2">
                <span className="font-black leading-none text-[#111] text-5xl">{selected}</span>
                <span className="text-sm text-[#6b7280]">{weekdayName}</span>
              </div>
            </div>
            <span className="shrink-0 text-sm text-[#6b7280]">
              {events.length} event{events.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {events.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#e5e7eb] px-4 py-8 text-center text-sm text-[#9aa0a6]">
                No events scheduled for this day.
              </p>
            ) : (
              events.map((event, index) => {
                const style = CARD[event.type];
                return (
                  <div key={index} className="rounded-2xl p-4" style={{ backgroundColor: style.bg }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#374151]">{event.time}</p>
                        <p className="mt-1 text-sm font-black uppercase leading-tight text-[#111]">{event.title}</p>
                        <p className="mt-0.5 text-xs text-[#6b7280]">{event.sub}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ backgroundColor: style.badgeBg, color: style.badgeFg }}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-[#9aa0a6]">
            Sessions booked in “The 1% Factor” and trials accepted in the Transfer Window appear here automatically.
          </p>

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
