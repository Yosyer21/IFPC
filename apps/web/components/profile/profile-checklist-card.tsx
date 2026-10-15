import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import type { ProfileChecklistState } from '@ifpc/config';
import { DonutChart } from '@/components/player/charts';

export interface ProfileChecklistCardProps {
  state: ProfileChecklistState;
  /** A dónde lleva el atajo "completa lo que falta" del móvil. */
  editHref: string;
  /** Qué se dice al llegar al 100% (cambia según el perfil). */
  completeText?: string;
}

/**
 * Profile strength: donut ponderado + lo que falta por completar, cada punto
 * con su link. Al 100% la lista desaparece: solo queda la confirmación.
 * En el móvil, en vez de ocho filas-botón seguidas, un solo atajo al formulario.
 * La comparten el perfil del jugador y el del club (`CLUB_PROFILE_CHECKLIST`).
 */
export function ProfileChecklistCard({
  state,
  editHref,
  completeText = 'Complete profile: clubs and scouts see everything they look for.',
}: ProfileChecklistCardProps) {
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
          <p className="text-sm text-muted-foreground">{completeText}</p>
        )}

        {missing.length > 0 ? (
          <>
            {/* En el móvil la lista completa se sustituye por un solo atajo: eran ocho
                filas-botón seguidas. El escritorio la sigue mostrando entera. */}
            <Link
              href={editHref}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:hidden"
            >
              <span>Complete the missing {missing.length} details</span>
              <span className="shrink-0 font-medium text-primary">Edit profile →</span>
            </Link>
            <ul className="hidden w-full flex-col gap-0.5 sm:flex">
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
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
