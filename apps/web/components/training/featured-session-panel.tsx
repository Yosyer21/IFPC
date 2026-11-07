import Link from 'next/link';
import { trainingWeekdayLabel } from '@ifpc/config';
import type { TrainingSessionView } from '@/lib/training-sessions';

const ORIGIN_LABEL: Record<string, string> = {
  GENERAL: 'Weekly plan',
  COACH: 'From your coach',
  CLUB: 'From your club',
};

const ORIGIN_EYEBROW: Record<string, string> = {
  GENERAL: 'Your weekly plan',
  COACH: 'From your coach',
  CLUB: 'From your club',
};

/**
 * Panel oscuro destacado con la próxima sesión del jugador (lenguaje de la
 * referencia de Training): etiqueta de origen, título grande condensado, meta y
 * CTA lima para empezar. Enlaza al detalle real de la sesión.
 */
export function FeaturedSessionPanel({ session }: { session: TrainingSessionView }) {
  const weekday = trainingWeekdayLabel(session.weekday);
  const total = session.items.length;
  const meta = [
    total ? `${total} exercise${total === 1 ? '' : 's'}` : null,
    session.totalMinutes ? `${session.totalMinutes} min` : null,
    weekday ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  const eyebrow = ORIGIN_EYEBROW[session.ownerType] ?? ORIGIN_LABEL[session.ownerType] ?? 'Your plan';

  return (
    <section className="fb-panel relative mb-6 overflow-hidden p-6 sm:p-8">
      {/* Elementos geométricos decorativos (lima), sutiles y sin afectar la lectura. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-0 h-full w-48 rotate-12 bg-brand/10"
        style={{ clipPath: 'polygon(35% 0, 100% 0, 65% 100%, 0 100%)' }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full border-[10px] border-brand/15"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-none text-white sm:text-[2rem]">
            {session.title}
          </h2>
          <p className="mt-2 truncate text-sm text-white/60">
            {meta}
            {session.description ? ` — ${session.description}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dashboard/player/training/sessions/${session.id}`}
            className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-ink transition-colors hover:brightness-95"
          >
            Start session
          </Link>
        </div>
      </div>
    </section>
  );
}
