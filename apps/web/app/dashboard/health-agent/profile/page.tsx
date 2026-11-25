import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart } from '@/components/player/charts';
import { ProfileGrid } from '@/components/profile/profile-grid';
import {
  HEALTH_AGENT_FORMAT_LABELS,
  HEALTH_AGENT_SPECIALTY_LABELS,
  formatPriceFrom,
  healthAgentLocation,
  healthAgentProfileChecklist,
} from '@/lib/health-agent';

export const metadata: Metadata = { title: 'My practice · Health agent' };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </div>
    </div>
  );
}

export default async function HealthAgentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { updated } = await searchParams;
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'HEALTH_AGENT') return null;

  const [user, agent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.healthAgent.findUnique({ where: { userId: session.user.id } }),
  ]);

  const name = user?.name ?? session.user.name ?? 'Health agent';
  const parts = name.split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  const checklist = healthAgentProfileChecklist(agent);
  const missing = checklist.items.filter((item) => !item.done);
  const location = healthAgentLocation(agent);
  const price = agent ? formatPriceFrom(agent.priceFrom, agent.currency) : null;
  const specialtyLabels = (agent?.specialties ?? []).map(
    (value) => HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My practice"
        subtitle="Your health-agent profile across nutrition, sport psychology and physiotherapy."
        icon="health"
      />

      {updated ? (
        <div className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-medium text-[#4f6b0a]">
          Profile saved.
        </div>
      ) : null}

      {!agent ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <h2 className="text-lg font-semibold">Complete your practice profile</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Players and families see this profile in The &quot;1%&quot; Factor before booking.
              Add your specialties, services and credentials to start receiving requests.
            </p>
            <Link
              href="/dashboard/health-agent/profile/edit"
              className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              Create profile
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-10 top-0 h-full w-28 rotate-12 bg-brand/15" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <PlayerAvatar
                firstName={firstName}
                lastName={lastName}
                imageUrl={user?.image ?? null}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
                  Health agent
                </p>
                <h1 className="mt-1 font-display text-3xl uppercase leading-none">
                  {agent.practiceName}
                </h1>
                {agent.headline ? (
                  <p className="mt-2 text-sm text-white/70">{agent.headline}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      agent.verified ? 'bg-brand text-ink' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {agent.verified ? 'Verified' : 'Pending verification'}
                  </span>
                  {agent.backgroundChecked ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      Background checked
                    </span>
                  ) : null}
                  {specialtyLabels.map((label) => (
                    <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
                  {location ? <span>{location}</span> : null}
                  <span>{HEALTH_AGENT_FORMAT_LABELS[agent.format] ?? agent.format}</span>
                  {agent.sessionsOnline ? <span>Online sessions</span> : null}
                </div>
              </div>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat value={String(agent.yearsExperience ?? '—')} label="Years" />
              <Stat value={String(agent.clientsServed ?? '—')} label="Clients" />
              <Stat value={price ?? '—'} label="Price from" />
              <Stat
                value={agent.ratingAvg != null ? agent.ratingAvg.toFixed(1) : '—'}
                label={`${agent.reviewCount} reviews`}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              {agent.about ? (
                <Card>
                  <CardContent>
                    <h2 className="mb-2 font-semibold">About the practice</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{agent.about}</p>
                  </CardContent>
                </Card>
              ) : null}

              {agent.services.length > 0 ? (
                <Card>
                  <CardContent>
                    <h2 className="mb-2 font-semibold">Services</h2>
                    <div className="flex flex-wrap gap-2">
                      {agent.services.map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-brand/15 px-3 py-1 text-sm font-medium text-[#4f6b0a]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                    {agent.approach.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {agent.approach.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardContent>
                  <h2 className="mb-3 font-semibold">Location &amp; contact</h2>
                  <ProfileGrid
                    rows={[
                      ['Practice', agent.practiceName],
                      ['Email', user?.email ?? '—'],
                      ['Location', location ?? '—'],
                      ['Languages', agent.languages.join(', ') || '—'],
                      ['Website', agent.website ?? '—'],
                      ['Availability', agent.availabilityNote ?? '—'],
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="flex flex-col items-center gap-3">
                  <h2 className="self-start font-semibold">Profile strength</h2>
                  <DonutChart
                    value={checklist.percent}
                    label={`${checklist.percent}%`}
                    sublabel={`${checklist.items.length - missing.length}/${checklist.items.length} completed`}
                  />
                  {missing.length > 0 ? (
                    <Link
                      href="/dashboard/health-agent/profile/edit"
                      className="w-full rounded-lg border border-border/70 px-3 py-2 text-center text-sm font-medium text-[#4f6b0a] transition-colors hover:bg-muted"
                    >
                      Complete the missing {missing.length} details
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your profile is complete. Verified practices convert more bookings.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="mb-3 font-semibold">Verification</h2>
                  <ProfileGrid
                    rows={[
                      ['Status', agent.verified ? 'Verified' : 'Pending verification'],
                      ['Background', agent.backgroundChecked ? 'Checked' : 'Not checked'],
                      ['Registration', agent.registrationNumber ?? '—'],
                      ['Insurance', agent.insuranceProvider ?? '—'],
                      [
                        'Insurance expires',
                        agent.insuranceExpiresAt
                          ? agent.insuranceExpiresAt.toLocaleDateString('en-GB')
                          : '—',
                      ],
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-1">
                  <h2 className="mb-2 font-semibold">Manage</h2>
                  <Link
                    href="/dashboard/health-agent/profile/edit"
                    className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Edit practice profile
                  </Link>
                  <Link
                    href="/dashboard/health-agent/id"
                    className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    View ID card
                  </Link>
                  <Link
                    href="/dashboard/health-agent"
                    className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Back to overview
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
