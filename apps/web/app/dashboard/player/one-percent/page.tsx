import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import {
  HEALTH_AGENT_SPECIALTY_LABELS,
  formatPriceFrom,
  healthAgentLocation,
} from '@/lib/health-agent';
import { isListable } from '@/lib/verification';

export const metadata: Metadata = { title: 'The "1%" Factor' };

const TABS = [
  { key: 'all', label: 'All', specialty: null },
  { key: 'nutrition', label: 'Nutrition', specialty: 'NUTRITION' },
  { key: 'psychology', label: 'Sport psychology', specialty: 'PSYCHOLOGY' },
  { key: 'physiotherapy', label: 'Physiotherapy', specialty: 'PHYSIOTHERAPY' },
] as const;

export default async function OnePercentPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const nextBooking = player
    ? await prisma.booking.findFirst({
        where: { playerId: player.id, status: 'CONFIRMED', startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        include: { healthAgent: { select: { practiceName: true } } },
      })
    : null;

  const { specialty } = await searchParams;
  const active = (specialty ?? 'all').toLowerCase();
  const filter = TABS.find((tab) => tab.key === active)?.specialty ?? null;

  const agents = (
    await prisma.healthAgent.findMany({
      where: filter ? { verified: true, specialties: { has: filter } } : { verified: true },
      orderBy: [{ ratingAvg: 'desc' }],
      take: 60,
    })
  ).filter((agent) => isListable(agent));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={'The "1%" Factor'}
        subtitle="Verified nutrition, sport psychology and physiotherapy specialists."
        icon="health"
      />

      {nextBooking ? (
        <Card className="mb-5">
          <CardContent className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Your next session</h2>
              <p className="text-sm text-muted-foreground">
                {nextBooking.healthAgent.practiceName} ·{' '}
                {nextBooking.startsAt.toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <Link
              href={`/dashboard/player/one-percent/${nextBooking.healthAgentId}`}
              className="text-sm font-medium text-[#4f6b0a] hover:underline"
            >
              View specialist →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={
              tab.specialty
                ? `/dashboard/player/one-percent?specialty=${tab.specialty}`
                : '/dashboard/player/one-percent'
            }
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              active === tab.key
                ? 'border-ink bg-ink text-white'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No verified specialists yet. Check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {agents.map((agent) => {
            const location = healthAgentLocation(agent);
            const price = formatPriceFrom(agent.priceFrom, agent.currency);
            return (
              <Card key={agent.id} className="card-hover">
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{agent.practiceName}</h2>
                      {agent.headline ? (
                        <p className="text-sm text-muted-foreground">{agent.headline}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-[#4f6b0a]">
                      Verified
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.specialties.map((value) => (
                      <span key={value} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {location ? <span>{location}</span> : null}
                    {price ? <span>From {price}</span> : null}
                    {agent.ratingAvg != null ? (
                      <span>
                        {agent.ratingAvg.toFixed(1)} ★ ({agent.reviewCount})
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={`/dashboard/player/one-percent/${agent.id}`}
                    className="mt-auto inline-flex w-fit items-center rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
                  >
                    View &amp; book
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
