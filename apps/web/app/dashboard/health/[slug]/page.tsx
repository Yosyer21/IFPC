import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconChevronDown } from '@/components/dashboard/icons';
import { HabitChecklist } from '@/components/health/habit-checklist';
import {
  FACTOR_DOT_CLASSES,
  HEALTH_FACTORS,
  factorNeighbours,
  getHealthFactor,
  type HealthFactor,
} from '@/lib/health';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const factor = getHealthFactor(slug);
  return { title: factor ? `${factor.title} — The “1%” Factor` : 'Health' };
}

/**
 * Ficha de un factor del hub: por qué cuenta, qué hacer y cómo saber que funciona.
 * Todo el texto sale de `HEALTH_FACTORS`, así que la página no se toca al añadir
 * factores nuevos.
 */
export default async function HealthFactorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const factor = getHealthFactor(slug);
  if (!factor) notFound();

  const { previous, next } = factorNeighbours(slug);

  // Posición en el recorrido y factores compañeros (enlaces cruzados).
  const position = HEALTH_FACTORS.findIndex((item) => item.slug === factor.slug) + 1;
  const related = factor.related
    .map((relatedSlug) => getHealthFactor(relatedSlug))
    .filter((item): item is HealthFactor => Boolean(item));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/health"
        className="animate-fade-up mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconChevronDown className="h-4 w-4 rotate-90" />
        All the 1% factors
      </Link>

      <PageHeader title={factor.title} subtitle={factor.tagline} icon={factor.icon}>
        <span className="chip-gradient rounded-full px-3 py-1 text-xs font-semibold tabular-nums">
          Factor {position} of {HEALTH_FACTORS.length}
        </span>
      </PageHeader>

      <Card className="animate-fade-up mb-4">
        <CardContent>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
            Why it matters
          </h2>
          <p className="text-sm leading-relaxed">{factor.why}</p>
        </CardContent>
      </Card>

      <Card className="animate-fade-up mb-4" style={{ animationDelay: '60ms' }}>
        <CardContent>
          <HabitChecklist slug={factor.slug} habits={factor.habits} tone={factor.tone} />
        </CardContent>
      </Card>

      <Card className="animate-fade-up mb-4" style={{ animationDelay: '120ms' }}>
        <CardContent>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
            How you know it is working
          </h2>
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${FACTOR_DOT_CLASSES[factor.tone]}`}
            />
            {factor.metric}
          </p>
        </CardContent>
      </Card>

      {related.length > 0 ? (
        <Card className="animate-fade-up mb-6" style={{ animationDelay: '160ms' }}>
          <CardContent>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              Pairs well with
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/dashboard/health/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${FACTOR_DOT_CLASSES[item.tone]}`}
                  />
                  {item.title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <nav className="animate-fade-up flex items-stretch justify-between gap-3">
        {previous ? (
          <Link
            href={`/dashboard/health/${previous.slug}`}
            className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border p-3 text-sm transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IconChevronDown className="h-4 w-4 shrink-0 rotate-90 text-muted-foreground transition-colors group-hover:text-brand" />
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                Previous
              </span>
              <span className="block truncate font-medium">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}

        {next ? (
          <Link
            href={`/dashboard/health/${next.slug}`}
            className="group flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl border border-border p-3 text-right text-sm transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                Next
              </span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <IconChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-muted-foreground transition-colors group-hover:text-brand" />
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
