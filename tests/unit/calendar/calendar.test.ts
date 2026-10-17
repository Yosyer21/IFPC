import { describe, expect, it, vi } from 'vitest';

// El módulo agrega consultas con Prisma y reutiliza la visibilidad de otras
// áreas; aquí solo se prueban las funciones puras, así que se aíslan.
vi.mock('@ifpc/database', () => ({ prisma: {} }));
vi.mock('@ifpc/auth', () => ({ auth: vi.fn() }));

import {
  CALENDAR_GRID_DAYS,
  addDays,
  buildMonthGrid,
  dayKey,
  eventsOnDay,
  eventKindLabel,
  groupEventsByDay,
  isSameDay,
  isSameMonth,
  isToday,
  monthParam,
  parseDayParam,
  parseMonthParam,
  resolveSelectedDay,
  shiftMonth,
  startOfDay,
  startOfMonth,
  startOfWeekMonday,
  upcomingEvents,
  type CalendarEvent,
} from '@/lib/calendar';
import { CALENDAR_EVENT_KINDS, isCalendarEventKind } from '@ifpc/config';

function event(id: string, at: string, kind: CalendarEvent['kind'] = 'live'): CalendarEvent {
  return { id, kind, title: id, detail: null, at: new Date(at), endAt: null, href: null };
}

describe('rejilla del calendario', () => {
  it('empieza la semana en lunes', () => {
    // 2026-10-16 es viernes → su lunes es el 12.
    expect(dayKey(startOfWeekMonday(new Date('2026-10-16T09:00:00Z')))).toBe('2026-10-12');
    // Un lunes se queda igual.
    expect(dayKey(startOfWeekMonday(new Date('2026-10-12T00:00:00Z')))).toBe('2026-10-12');
    // Un domingo va al lunes anterior (semana europea).
    expect(dayKey(startOfWeekMonday(new Date('2026-10-18T23:59:00Z')))).toBe('2026-10-12');
  });

  it('devuelve siempre 6 semanas y arranca en el lunes del mes', () => {
    const grid = buildMonthGrid(new Date('2026-10-01T00:00:00Z'));
    expect(grid).toHaveLength(CALENDAR_GRID_DAYS);
    expect(dayKey(grid[0]!)).toBe('2026-09-28');
    expect(grid[0]!.getUTCDay()).toBe(1); // lunes
    // El último día completa las 6 semanas.
    expect(dayKey(grid[grid.length - 1]!)).toBe('2026-11-08');
  });

  it('mes de febrero: la rejilla cubre el mes completo', () => {
    const grid = buildMonthGrid(new Date('2026-02-10T00:00:00Z'));
    expect(dayKey(grid[0]!)).toBe('2026-01-26');
    expect(grid.some((day) => dayKey(day) === '2026-02-28')).toBe(true);
  });

  it('startOfDay y startOfMonth normalizan a medianoche UTC', () => {
    expect(dayKey(startOfDay(new Date('2026-10-16T21:45:00Z')))).toBe('2026-10-16');
    expect(dayKey(startOfMonth(new Date('2026-10-16T21:45:00Z')))).toBe('2026-10-01');
  });

  it('addDays cruza el cambio de mes y de año', () => {
    expect(dayKey(addDays(new Date('2026-12-31T00:00:00Z'), 1))).toBe('2027-01-01');
    expect(dayKey(addDays(new Date('2026-03-01T00:00:00Z'), -1))).toBe('2026-02-28');
  });
});

describe('parámetro ?month=YYYY-MM', () => {
  it('serializa el mes en curso', () => {
    expect(monthParam(new Date('2026-10-16T12:00:00Z'))).toBe('2026-10');
  });

  it('parsea un valor válido al día 1', () => {
    const month = parseMonthParam('2026-03');
    expect(dayKey(month)).toBe('2026-03-01');
  });

  it('cae al mes de respaldo si falta o es inválido', () => {
    const fallback = new Date('2026-10-16T00:00:00Z');
    for (const value of [undefined, '', '2026-13', '2026-00', 'octubre', '2026/10']) {
      expect(dayKey(parseMonthParam(value, fallback))).toBe('2026-10-01');
    }
  });

  it('shiftMonth cruza el año en ambos sentidos', () => {
    expect(monthParam(shiftMonth(new Date('2026-01-15T00:00:00Z'), -1))).toBe('2025-12');
    expect(monthParam(shiftMonth(new Date('2026-12-15T00:00:00Z'), 1))).toBe('2027-01');
  });
});

describe('comparaciones de día', () => {
  it('isSameDay ignora la hora', () => {
    expect(isSameDay(new Date('2026-10-16T00:00:00Z'), new Date('2026-10-16T23:59:59Z'))).toBe(true);
    expect(isSameDay(new Date('2026-10-16T23:59:59Z'), new Date('2026-10-17T00:00:00Z'))).toBe(false);
  });

  it('isSameMonth solo mira mes y año', () => {
    expect(isSameMonth(new Date('2026-10-31T00:00:00Z'), new Date('2026-10-01T00:00:00Z'))).toBe(true);
    expect(isSameMonth(new Date('2026-11-01T00:00:00Z'), new Date('2026-10-01T00:00:00Z'))).toBe(false);
  });

  it('isToday compara con la fecha dada', () => {
    expect(isToday(new Date('2026-10-16T08:00:00Z'), new Date('2026-10-16T20:00:00Z'))).toBe(true);
    expect(isToday(new Date('2026-10-16T08:00:00Z'), new Date('2026-10-17T01:00:00Z'))).toBe(false);
  });
});

describe('agrupado y próximos eventos', () => {
  const events = [
    event('b', '2026-10-16T18:00:00Z'),
    event('a', '2026-10-16T09:00:00Z'),
    event('c', '2026-10-17T10:00:00Z'),
  ];

  it('agrupa por día y ordena cada día por hora', () => {
    const byDay = groupEventsByDay(events);
    expect([...byDay.keys()].sort()).toEqual(['2026-10-16', '2026-10-17']);
    expect(byDay.get('2026-10-16')!.map((item) => item.id)).toEqual(['a', 'b']);
    expect(byDay.get('2026-10-17')!.map((item) => item.id)).toEqual(['c']);
  });

  it('upcomingEvents filtra desde ahora, ordena y limita', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(upcomingEvents(events, now).map((item) => item.id)).toEqual(['b', 'c']);
    expect(upcomingEvents(events, now, 1).map((item) => item.id)).toEqual(['b']);
    expect(upcomingEvents(events, new Date('2027-01-01T00:00:00Z'))).toEqual([]);
  });
});

describe('tipos de evento', () => {
  it('todas las clases de evento tienen etiqueta', () => {
    for (const kind of CALENDAR_EVENT_KINDS) {
      expect(eventKindLabel(kind)).toBeTruthy();
    }
  });

  it('isCalendarEventKind valida el tipo', () => {
    expect(isCalendarEventKind('live')).toBe(true);
    expect(isCalendarEventKind('nope')).toBe(false);
    expect(isCalendarEventKind(42)).toBe(false);
  });
});

describe('día seleccionado', () => {
  it('parseDayParam acepta fechas reales y rechaza el resto', () => {
    expect(dayKey(parseDayParam('2026-10-16')!)).toBe('2026-10-16');
    for (const value of [undefined, '', '2026-10', '16-10-2026', '2026-13-01', '2026-02-31']) {
      expect(parseDayParam(value)).toBeNull();
    }
  });

  it('respeta el día pedido por la URL', () => {
    const selected = resolveSelectedDay({
      requested: '2026-10-20',
      month: new Date('2026-10-01T00:00:00Z'),
      daysWithEvents: ['2026-10-05'],
      now: new Date('2026-10-16T12:00:00Z'),
    });
    expect(dayKey(selected)).toBe('2026-10-20');
  });

  it('sin día pedido, abre en hoy cuando hoy está en el mes visible', () => {
    const selected = resolveSelectedDay({
      month: new Date('2026-10-01T00:00:00Z'),
      daysWithEvents: [],
      now: new Date('2026-10-16T12:00:00Z'),
    });
    expect(dayKey(selected)).toBe('2026-10-16');
  });

  it('en otro mes, cae al primer día con eventos', () => {
    const selected = resolveSelectedDay({
      month: new Date('2026-12-01T00:00:00Z'),
      daysWithEvents: ['2026-12-20', '2026-12-03', '2026-10-16'],
      now: new Date('2026-10-16T12:00:00Z'),
    });
    expect(dayKey(selected)).toBe('2026-12-03');
  });

  it('sin eventos ni hoy, cae al día 1 del mes', () => {
    const selected = resolveSelectedDay({
      month: new Date('2026-12-01T00:00:00Z'),
      daysWithEvents: ['2026-10-16'],
      now: new Date('2026-10-16T12:00:00Z'),
    });
    expect(dayKey(selected)).toBe('2026-12-01');
  });

  it('eventsOnDay deja solo los del día', () => {
    const events = [
      event('a', '2026-10-16T09:00:00Z'),
      event('b', '2026-10-16T18:00:00Z'),
      event('c', '2026-10-17T10:00:00Z'),
    ];
    const day = eventsOnDay(events, new Date('2026-10-16T00:00:00Z'));
    expect(day.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
