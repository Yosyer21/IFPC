import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import type { ProfileChecklistState } from '@ifpc/config';
import { DonutChart } from '@/components/player/charts';

/**
 * Profile strength: donut ponderado + lo que falta por completar, cada punto
 * con su link. Al 100% la lista desaparece: solo queda la confirmación.
 */
export function ProfileChecklistCard({ state }: { state: ProfileChecklistState }) {
  const { percent, completed, total, next, items } = state;
  const missing = items.filter((item) => !item.done);

  return (
    <Card className="animate-fade-up" style={{ animationDelay: '160ms' }}>
      <CardContent className="flex w-full flex-col items-center gap-4">
        <h2 className="self-start font-semibold">Profile strength</h2>
        <DonutChart
          value={percent}
          label={`${percent}%`}
          sublabel={`${completed}/${total} completed`}
        />

        {next ? (
          <Link
            href={next.href}
            className="w-full rounded-lg border p-3 transition-colors hover:bg-muted"
            style={{ borderColor: 'var(--profile-accent, currentColor)' }}
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Next best step
            </span>
            <span className="mt-0.5 block text-sm font-medium">{next.label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{next.hint}</span>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete profile: clubs and scouts see everything they look for.
          </p>
        )}

        {missing.length > 0 ? (
          <ul className="flex w-full flex-col gap-0.5">
            {missing.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span>{item.label}</span>
                  <span className="shrink-0 text-xs tabular-nums">+{item.weight}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
