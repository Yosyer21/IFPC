import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { IconCheckCircle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'School ID' };

/** Fila de checklist con la palomita lima de la referencia. */
function CheckRow({ title, hint }: { title: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
        <IconCheckCircle className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </li>
  );
}

/** Fila etiqueta/valor de los detalles del panel oscuro. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="truncate text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

export default async function UniversityProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!university) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: { universityId: university.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  const openOpportunities = opportunities.filter((item) => item.status === 'OPEN');
  const totalOpportunities = opportunities.length;
  const applications = opportunities.reduce((sum, item) => sum + item._count.applications, 0);
  const year = university.createdAt.getFullYear();

  const initials =
    university.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'U';

  const place = [university.city, university.country].filter(Boolean).join(' · ');

  const stats: { value: string; label: string }[] = [
    { value: String(openOpportunities.length), label: 'Open opportunities' },
    { value: String(totalOpportunities), label: 'Total opportunities' },
    { value: String(applications), label: 'Applications' },
    { value: String(year), label: 'Member since' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="School ID"
        subtitle="Your program's CV. What families see when a scholarship is offered."
        icon="book"
      />

      {/* Panel oscuro destacado (referencia School ID) */}
      <section className="fb-panel animate-fade-up relative mb-6 overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.7fr)]">
          {/* Zona decorativa con las iniciales */}
          <div className="relative flex min-h-44 items-center justify-center overflow-hidden p-8 lg:min-h-full lg:p-10">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[9rem] uppercase leading-none text-white/[0.05]"
            >
              {initials}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 top-0 h-[140%] w-24 rotate-12 bg-brand"
              style={{ clipPath: 'polygon(40% 0, 70% 0, 30% 100%, 0 100%)' }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 top-6 h-16 w-16 border-[6px] border-brand/40"
              style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
            />
            <div
              className="relative flex h-32 w-32 items-center justify-center bg-brand text-ink"
              style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
            >
              <span className="font-display text-4xl uppercase leading-none">{initials}</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              {place || 'International program'}
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase leading-none text-white sm:text-4xl">
              {university.name}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                <IconCheckCircle className="h-3.5 w-3.5" />
                {openOpportunities.length > 0 ? 'Open to applications' : 'No open roles right now'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
                Member since {year}
              </span>
            </div>

            {/* Estadisticas grandes */}
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-ink px-3 py-4 text-center">
                  <div className="fb-stat text-3xl">{stat.value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Detalles en dos columnas */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="fb-section-label text-white/40">Program details</p>
                <dl className="mt-2 divide-y divide-white/10">
                  <DetailRow label="Institution" value={university.name} />
                  <DetailRow label="Country" value={university.country} />
                  <DetailRow label="City" value={university.city ?? '—'} />
                </dl>
              </div>
              <div>
                <p className="fb-section-label text-white/40">Recruitment</p>
                <dl className="mt-2 divide-y divide-white/10">
                  <DetailRow label="Open" value={String(openOpportunities.length)} />
                  <DetailRow label="Internal" value={university.user?.email ?? '—'} />
                  <DetailRow
                    label="Since"
                    value={university.createdAt.toLocaleDateString('en-GB')}
                  />
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarjetas con checklist (datos reales) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-up">
          <CardContent>
            <h3 className="mb-3 text-base font-bold tracking-tight">Open opportunities</h3>
            {openOpportunities.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {openOpportunities.slice(0, 4).map((item) => (
                  <CheckRow
                    key={item.id}
                    title={item.title}
                    hint={(OPPORTUNITY_TYPE_LABELS as Record<string, string>)[item.type] ?? item.type}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No open opportunities yet. Publish one to reach players.
              </p>
            )}
            <Link
              href="/dashboard/university/opportunities"
              className="mt-4 inline-flex text-sm font-semibold text-foreground hover:underline"
            >
              Manage opportunities →
            </Link>
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardContent>
            <h3 className="mb-3 text-base font-bold tracking-tight">Recruitment</h3>
            <ul className="flex flex-col gap-3">
              <CheckRow title={`${totalOpportunities} opportunities`} hint="All statuses" />
              <CheckRow title={`${applications} applications`} hint="Received from players" />
              <CheckRow title={`${openOpportunities.length} live now`} hint="Open to apply" />
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardContent>
            <h3 className="mb-3 text-base font-bold tracking-tight">Contact</h3>
            <ul className="flex flex-col gap-3">
              <CheckRow title={university.user?.email ?? '—'} hint="Recruitment inbox" />
              <CheckRow title={university.country} hint="Country" />
              <CheckRow title={university.city ?? '—'} hint="City" />
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
