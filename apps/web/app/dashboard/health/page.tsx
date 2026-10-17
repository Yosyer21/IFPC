import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { ICONS } from '@/components/dashboard/icons';
import { PageHeader } from '@/components/player/page-header';
import {
  FACTOR_CHIP_CLASSES,
  FACTOR_DOT_CLASSES,
  HEALTH_FACTORS,
  compoundGain,
  factorOfTheDay,
  formatGain,
  weekPlan,
} from '@/lib/health';

export const metadata: Metadata = { title: 'Health — The “1%” Factor' };

/** El «1 %» compuesto a un año: lo que hace visible el nombre del hub. */
const BETTER_YEAR = formatGain(compoundGain(1, 365));
const WORSE_YEAR = formatGain(compoundGain(-1, 365));

/**
 * THE "1%" FACTOR — portada del hub de salud.
 *
 * La rejilla se genera desde `HEALTH_FACTORS` (`lib/health.ts`): añadir un factor
 * nuevo es añadir una entrada, sin tocar esta página.
 */
export default function HealthHubPage() {
  const now = new Date();
  const daily = factorOfTheDay(HEALTH_FACTORS, now);
  const DailyIcon = daily ? ICONS[daily.icon] : undefined;
  // 0 = lunes, la misma convención que `weekPlan` y `TRAINING_WEEKDAYS`.
  const todayWeekday = (now.getUTCDay() + 6) % 7;
  const plan = weekPlan(HEALTH_FACTORS);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="THE “1%” FACTOR"
        subtitle="The small things that separate good from excellent — done on ordinary days"
        icon="health"
      />

      {/* La idea, en números. */}
      <Card className="animate-fade-up mb-4">
        <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="w-full min-w-0 lg:flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Marginal gains
            </p>
            <h2 className="mt-1 text-xl font-bold">Small things, done every day</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Nobody builds a career on one big session. It is built on the boring things repeated
              on ordinary days: sleeping, drinking, eating, resting, moving, focusing — and turning
              up again tomorrow. {HEALTH_FACTORS.length} factors, each worth about one percent.
            </p>
          </div>

          <div className="flex items-end gap-5">
            <div>
              <div className="text-gradient-brand text-4xl font-black tabular-nums">
                {BETTER_YEAR}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">1% better every day</p>
            </div>
            <div className="pb-1 text-xl font-black text-muted-foreground/40">vs</div>
            <div>
              <div className="text-4xl font-black tabular-nums text-muted-foreground/70">
                {WORSE_YEAR}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">1% worse every day</p>
            </div>
          </div>

          <p className="w-full text-xs text-muted-foreground">
            Compounded over a year (1.01<sup>365</sup> and 0.99<sup>365</sup>).
          </p>

          {/* Hoy: el 1 % — entrada diaria, rotación determinista por fecha. */}
          {daily ? (
            <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-brand/30 bg-brand/[0.07] p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${FACTOR_CHIP_CLASSES[daily.tone]}`}
                >
                  {DailyIcon ? <DailyIcon className="h-5 w-5" /> : null}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
                    Today’s 1%
                  </p>
                  <p className="truncate text-sm font-semibold">{daily.title}</p>
                </div>
              </div>
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">{daily.quickAction}</p>
              <Link
                href={`/dashboard/health/${daily.slug}`}
                className="shrink-0 text-xs font-medium text-brand hover:underline"
              >
                Open →
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Salto rápido: con siete tarjetas, evita recorrerlas enteras. */}
      <nav aria-label="Jump to a factor" className="animate-fade-up mb-3 flex flex-wrap gap-2">
        {HEALTH_FACTORS.map((factor) => (
          <a
            key={factor.slug}
            href={`#${factor.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.02] px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${FACTOR_DOT_CLASSES[factor.tone]}`} />
            {factor.title}
          </a>
        ))}
      </nav>

      {/* Rejilla de factores. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HEALTH_FACTORS.map((factor, index) => {
          const Icon = ICONS[factor.icon];
          return (
            <Link
              key={factor.slug}
              id={factor.slug}
              href={`/dashboard/health/${factor.slug}`}
              className="animate-fade-up group block scroll-mt-24 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Read the 1% →
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Ritmo semanal y chuleta: consulta rápida al final de la página. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardContent>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              The week
            </h2>
            <ul className="flex flex-col gap-1">
              {plan.map(({ weekday, label, factor }) => {
                const isToday = weekday === todayWeekday;
                return (
                  <li
                    key={weekday}
                    className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isToday ? 'bg-brand/10 ring-1 ring-brand/30' : ''
                    }`}
                  >
                    <span
                      className={`w-9 shrink-0 text-xs font-semibold uppercase tracking-wide ${
                        isToday ? 'text-brand' : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${FACTOR_DOT_CLASSES[factor.tone]}`}
                    />
                    <Link
                      href={`/dashboard/health/${factor.slug}`}
                      className="min-w-0 flex-1 truncate font-medium transition-colors hover:text-brand"
                    >
                      {factor.title}
                    </Link>
                    {isToday ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-brand">
                        Today
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <CardContent>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              Cheat sheet
            </h2>
            <ul className="flex flex-col gap-2">
              {HEALTH_FACTORS.map((factor) => (
                <li key={factor.slug} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${FACTOR_DOT_CLASSES[factor.tone]}`}
                  />
                  <span className="text-sm">
                    <Link
                      href={`/dashboard/health/${factor.slug}`}
                      className="font-medium transition-colors hover:text-brand"
                    >
                      {factor.title}
                    </Link>
                    <span className="text-muted-foreground"> — {factor.quickAction}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="animate-fade-up mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${FACTOR_DOT_CLASSES.brand}`} />
        Start with one factor. Hold it two weeks. Then add the next.
      </p>
    </div>
  );
}
