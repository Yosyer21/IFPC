'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { ICONS } from '@/components/dashboard/icons';
import {
  FACTOR_CHIP_CLASSES,
  filterFactors,
  healthDayKey,
  healthStorageKey,
  normalizeProgress,
  progressSummary,
  type HealthFactor,
} from '@/lib/health';

/** Estado del factor leído del navegador (el mismo almacén que la checklist). */
interface FactorState {
  todayDone: number;
  total: number;
  streak: number;
  daysDone: number;
}

/** Distintivo de la tarjeta según el progreso; `null` si aún no hay nada. */
function badgeFor(state: FactorState | undefined): { text: string; className: string } | null {
  if (!state) return null;
  if (state.total > 0 && state.todayDone >= state.total) {
    return { text: 'Done today', className: 'border-brand/40 bg-brand/10 text-brand' };
  }
  if (state.todayDone > 0) {
    return {
      text: `${state.todayDone}/${state.total} today`,
      className: 'border-border text-muted-foreground',
    };
  }
  if (state.streak > 0) {
    return { text: `${state.streak}-day streak`, className: 'border-border text-muted-foreground' };
  }
  if (state.daysDone > 0) {
    return { text: `${state.daysDone} days done`, className: 'border-border text-muted-foreground' };
  }
  return null;
}

/**
 * Rejilla de factores con **buscador** y con el **progreso** que cada persona
 * tiene guardado en su navegador (mismo `localStorage` que la checklist de la
 * ficha): así el hub devuelve de un vistazo por dónde vas.
 *
 * Es cliente porque el progreso vive en el navegador; el contenido llega por
 * props desde el servidor (dato plano). Las tarjetas conservan su `id` (`slug`)
 * para que sigan siendo el destino de los chips de salto rápido.
 */
export function FactorGrid({ factors }: { factors: HealthFactor[] }) {
  const [query, setQuery] = useState('');
  const [states, setStates] = useState<Record<string, FactorState>>({});

  useEffect(() => {
    const today = healthDayKey(new Date());
    const next: Record<string, FactorState> = {};

    for (const factor of factors) {
      try {
        const raw = window.localStorage.getItem(healthStorageKey(factor.slug));
        const stored = normalizeProgress(raw ? JSON.parse(raw) : null, today);
        const summary = progressSummary(stored.days);
        next[factor.slug] = {
          todayDone: stored.habits.length,
          total: factor.habits.length,
          streak: summary.current,
          daysDone: summary.total,
        };
      } catch {
        // Sin localStorage la tarjeta se queda sin distintivo.
      }
    }
    setStates(next);
  }, [factors]);

  const visible = useMemo(() => filterFactors(factors, query), [factors, query]);

  return (
    <>
      <label className="mb-3 block">
        <span className="sr-only">Filter factors</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Filter: sleep, water, focus…"
          className="h-10 w-full rounded-xl border border-border bg-white/[0.03] px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand/50 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {visible.length === 0 ? (
        <Card>
          <CardContent>
            <p role="status" className="text-sm text-muted-foreground">
              No factor matches “{query.trim()}”. Try “sleep”, “water” or “focus”.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((factor, index) => {
            const Icon = ICONS[factor.icon];
            const badge = badgeFor(states[factor.slug]);
            return (
              <Link
                key={factor.slug}
                id={factor.slug}
                href={`/dashboard/health/${factor.slug}`}
                className="animate-fade-up group block scroll-mt-32 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <Card className="card-hover h-full border border-border/60 bg-white/[0.02] group-hover:border-brand/40">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${FACTOR_CHIP_CLASSES[factor.tone]}`}
                      >
                        {Icon ? <Icon className="h-5 w-5" /> : null}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold transition-colors group-hover:text-brand">
                          {factor.title}
                        </h3>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{factor.tagline}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{factor.summary}</p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        Read the 1% →
                      </span>
                      {badge ? (
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
