import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import type { ProfileChecklistState } from '@ifpc/config';
import { DonutChart } from '@/components/player/charts';
import type { ProfileNextStep } from '@/lib/player';

export interface ProfileStrengthMeterProps {
  state: ProfileChecklistState;
  /** Mejor siguiente paso (ya resuelto por `nextProfileStep`). */
  next: ProfileNextStep | null;
  editHref: string;
  /** `vertical` para columnas estrechas (dashboard); `horizontal` para páginas anchas. */
  orientation?: 'vertical' | 'horizontal';
  delayMs?: number;
}

/**
 * Medidor compacto de fuerza del perfil: donut + % + mejor siguiente paso.
 * Es la versión corta de `ProfileChecklistCard` (perfil completo) para el
 * dashboard y el Player ID, donde el libro pide «% + consejo».
 */
export function ProfileStrengthMeter({
  state,
  next,
  editHref,
  orientation = 'vertical',
  delayMs = 400,
}: ProfileStrengthMeterProps) {
  const vertical = orientation === 'vertical';

  return (
    <Card
      className="animate-fade-up"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <CardContent
        className={`flex w-full gap-4 ${
          vertical ? 'flex-col items-center text-center' : 'flex-col sm:flex-row sm:items-center'
        }`}
      >
        <DonutChart
          value={state.percent}
          size={vertical ? 132 : 112}
          stroke={9}
          label={`${state.percent}%`}
          sublabel={`${state.completed}/${state.total} completed`}
        />

        <div className={`min-w-0 flex-1 ${vertical ? 'w-full' : ''}`}>
          <h2 className="font-semibold">Profile strength</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clubs and scouts see this score. The fastest way to raise it is your next best step.
          </p>

          {next ? (
            <Link
              href={next.href}
              className="mt-3 block rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Next best step
              </span>
              <span className="mt-0.5 block text-sm font-semibold">{next.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{next.hint}</span>
            </Link>
          ) : (
            <p className="mt-3 text-sm font-medium text-emerald-600">
              Profile complete — clubs and scouts can see everything they look for.
            </p>
          )}

          <Link
            href={editHref}
            className="mt-3 inline-block text-xs font-medium text-[#4f6b0a] hover:underline"
          >
            Edit profile →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
