import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { IdActions } from '@/components/id/id-actions';
import {
  HEALTH_AGENT_FORMAT_LABELS,
  HEALTH_AGENT_SPECIALTY_LABELS,
  formatPriceFrom,
  healthAgentLocation,
} from '@/lib/health-agent';

export const metadata: Metadata = { title: 'ID card · Health agent' };

function Panel({ title, lines }: { title: string; lines: (string | null)[] }) {
  const items = lines.filter((line): line is string => Boolean(line));
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((line, index) => (
            <li key={`${title}-${index}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

export default async function HealthAgentIdPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') return null;

  const [user, agent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
    prisma.healthAgent.findUnique({ where: { userId: session.user.id } }),
  ]);

  const name = user?.name ?? session.user.name ?? 'Health agent';
  const parts = name.split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="ID card" subtitle="A printable summary of your practice." icon="file" />
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Create your practice profile to generate your ID card.
            </p>
            <Link
              href="/dashboard/health-agent/profile/edit"
              className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              Create profile
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const location = healthAgentLocation(agent);
  const price = formatPriceFrom(agent.priceFrom, agent.currency);
  const labels = agent.specialties.map((value) => HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value);

  const stats: [string, string][] = [
    ['Years', String(agent.yearsExperience ?? '—')],
    ['Clients', String(agent.clientsServed ?? '—')],
    ['Price from', price ?? '—'],
    [
      'Reviews',
      agent.ratingAvg != null ? `${agent.ratingAvg.toFixed(1)} (${agent.reviewCount})` : '—',
    ],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="ID card"
          subtitle="A printable summary of your practice for players and families."
          icon="file"
        />
        <IdActions title="Health agent ID" />
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="relative bg-ink p-6 text-white">
          <div className="pointer-events-none absolute -right-8 top-0 h-full w-24 rotate-12 bg-brand/15" />
          <div className="relative flex items-center gap-4">
            <PlayerAvatar
              firstName={firstName}
              lastName={lastName}
              imageUrl={user?.image ?? null}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                Health agent
              </p>
              <h1 className="font-display text-2xl uppercase leading-none">
                {agent.practiceName}
              </h1>
              {agent.headline ? (
                <p className="mt-1 text-sm text-white/70">{agent.headline}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    agent.verified ? 'bg-brand text-ink' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {agent.verified ? 'Verified' : 'Pending verification'}
                </span>
                {agent.backgroundChecked ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                    Background checked
                  </span>
                ) : null}
                {labels.map((label) => (
                  <span key={label} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label}>
              <div className="text-xl font-black">{value}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 border-t border-border p-6 sm:grid-cols-3">
          <Panel
            title="Credentials"
            lines={[
              agent.registrationNumber ?? 'Registration pending',
              agent.insuranceProvider
                ? `Insurance: ${agent.insuranceProvider}`
                : 'Insurance pending',
              agent.insuranceExpiresAt
                ? `Expires ${agent.insuranceExpiresAt.toLocaleDateString('en-GB')}`
                : null,
            ]}
          />
          <Panel title="Services" lines={agent.services.length ? agent.services : ['—']} />
          <Panel title="Approach" lines={agent.approach.length ? agent.approach : ['—']} />
        </div>

        <div className="grid gap-2 border-t border-border p-6 text-sm sm:grid-cols-2">
          <p className="text-muted-foreground">
            Location: <span className="text-foreground">{location ?? '—'}</span>
          </p>
          <p className="text-muted-foreground">
            Format:{' '}
            <span className="text-foreground">
              {HEALTH_AGENT_FORMAT_LABELS[agent.format] ?? agent.format}
            </span>
          </p>
          <p className="text-muted-foreground">
            Languages: <span className="text-foreground">{agent.languages.join(', ') || '—'}</span>
          </p>
          <p className="text-muted-foreground">
            Website: <span className="text-foreground">{agent.website ?? '—'}</span>
          </p>
        </div>
      </article>

      <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
        <Link href="/dashboard/health-agent/profile" className="text-[#4f6b0a] hover:underline">
          Back to profile
        </Link>
      </p>
    </div>
  );
}
