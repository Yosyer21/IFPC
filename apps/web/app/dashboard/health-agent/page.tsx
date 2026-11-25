import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { DonutChart } from '@/components/player/charts';
import { HEALTH_AGENT_SPECIALTY_LABELS, healthAgentProfileChecklist } from '@/lib/health-agent';

export const metadata: Metadata = { title: 'Health agent · Overview' };

const MODULES = [
  {
    title: 'Bookings',
    description: 'Parent-approved and paid requests from The "1%" Factor will appear here.',
  },
  {
    title: 'Clients & plans',
    description:
      'Meal plans, psychology programmes and return-to-play plans with weekly progress.',
  },
  {
    title: 'My listing',
    description: 'Your verified practice profile in The "1%" Factor, as players and parents see it.',
  },
];

export default async function HealthAgentOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.healthAgent.findUnique({ where: { userId: session.user.id } });
  const checklist = healthAgentProfileChecklist(agent);
  const specialtyLabels = (agent?.specialties ?? []).map(
    (value) => HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value
  );
  const nextBooking = agent
    ? await prisma.booking.findFirst({
        where: { healthAgentId: agent.id, status: 'CONFIRMED', startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        include: { player: { select: { firstName: true, lastName: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Health agent"
        subtitle="Nutrition, sport psychology and physiotherapy in one portal."
        icon="health"
      />

      {!agent ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-start gap-3">
            <h2 className="text-lg font-semibold">Set up your practice</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Create your practice profile to appear in The &quot;1%&quot; Factor and receive
              booking requests.
            </p>
            <Link
              href="/dashboard/health-agent/profile/edit"
              className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              Create practice profile
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{agent.practiceName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {agent.headline ?? 'Health agent practice'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    agent.verified ? 'bg-brand text-ink' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {agent.verified ? 'Verified' : 'Pending verification'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {specialtyLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-[#4f6b0a]"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/health-agent/profile"
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  View profile
                </Link>
                <Link
                  href="/dashboard/health-agent/profile/edit"
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Edit profile
                </Link>
                <Link
                  href="/dashboard/health-agent/id"
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  ID card
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-3">
              <h2 className="self-start font-semibold">Profile strength</h2>
              <DonutChart
                value={checklist.percent}
                label={`${checklist.percent}%`}
                sublabel="completed"
              />
              <Link
                href="/dashboard/health-agent/profile/edit"
                className="text-sm font-medium text-[#4f6b0a] hover:underline"
              >
                {checklist.percent === 100 ? 'Profile complete' : 'Finish your profile'} →
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {nextBooking ? (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Next session</h2>
              <p className="text-sm text-muted-foreground">
                {nextBooking.player.firstName} {nextBooking.player.lastName} ·{' '}
                {nextBooking.startsAt.toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <Link
              href="/dashboard/health-agent/bookings"
              className="text-sm font-medium text-[#4f6b0a] hover:underline"
            >
              Manage bookings →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MODULES.map((module) => (
          <Card key={module.title}>
            <CardContent>
              <h2 className="font-semibold">{module.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
