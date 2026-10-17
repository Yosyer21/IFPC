'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FACTOR_DOT_CLASSES,
  completionRatio,
  healthDayKey,
  healthStorageKey,
  normalizeProgress,
  recentDayKeys,
  streakDays,
  toggleHabit,
  type HealthProgress,
  type HealthTone,
} from '@/lib/health';

/** Días que se pintan en la tira de constancia. */
const TRACK_DAYS = 14;

/**
 * Checklist de los hábitos de un factor, guardada **en el navegador**
 * (`localStorage`): sin base de datos y sin cuenta.
 *
 * Muestra el progreso de hoy («2/4»), la racha de días seguidos y los últimos 14
 * días. El día entra en el histórico **solo** cuando están todos los hábitos
 * marcados (así «hecho» significa el factor completo, no a medias).
 *
 * Se lee al montar porque en el servidor no hay `localStorage`; hasta entonces
 * pinta el estado vacío, que es el mismo que el del render del servidor (sin
 * desajuste de hidratación).
 */
export function HabitChecklist({
  slug,
  habits,
  tone,
}: {
  slug: string;
  habits: string[];
  tone: HealthTone;
}) {
  const total = habits.length;
  const [today, setToday] = useState<string | null>(null);
  const [progress, setProgress] = useState<HealthProgress>({ day: '', habits: [], days: [] });

  useEffect(() => {
    const key = healthDayKey(new Date());
    setToday(key);
    try {
      const raw = window.localStorage.getItem(healthStorageKey(slug));
      setProgress(normalizeProgress(raw ? JSON.parse(raw) : null, key));
    } catch {
      // localStorage no disponible: se empieza de cero sin romper nada.
      setProgress(normalizeProgress(null, key));
    }
  }, [slug]);

  const persist = useCallback(
    (next: HealthProgress) => {
      setProgress(next);
      try {
        window.localStorage.setItem(healthStorageKey(slug), JSON.stringify(next));
      } catch {
        // Modo privado o cuota llena: la sesión actual sigue funcionando.
      }
    },
    [slug]
  );

  const toggle = (index: number) => {
    if (!today) return;
    persist(toggleHabit(progress, index, total, today));
  };

  const doneToday = today && progress.day === today ? progress.habits.length : 0;
  const ratio = completionRatio(doneToday, total);
  const streak = streakDays(progress.days);
  const track = today ? recentDayKeys(TRACK_DAYS) : [];
  const completed = new Set(progress.days);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand">
          The 1% — what to actually do
        </h2>
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              total > 0 && doneToday >= total ? FACTOR_DOT_CLASSES[tone] : 'bg-muted-foreground/40'
            }`}
          />
          {doneToday}/{total} today
        </span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${FACTOR_DOT_CLASSES[tone]}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {habits.map((habit, index) => {
          const done = progress.habits.includes(index);
          return (
            <li key={habit}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-brand/40 hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={done}
                  onChange={() => toggle(index)}
                />
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                    done
                      ? 'border-transparent bg-brand text-brand-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : index + 1}
                </span>
                <span
                  className={`text-sm leading-relaxed transition-colors ${
                    done ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {habit}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">
          {streak > 0
            ? `${streak}-day streak — keep it going`
            : 'Start your streak: complete every habit once'}
        </span>
        <div className="flex items-center gap-1">
          {track.map((day) => (
            <span
              key={day}
              title={day}
              aria-hidden="true"
              className={`h-3.5 w-3.5 rounded-sm transition-colors ${
                completed.has(day) ? FACTOR_DOT_CLASSES[tone] : 'bg-white/5'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Saved in this browser only — last {TRACK_DAYS} days.
      </p>
    </div>
  );
}
