import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { setVerificationAction } from '@/app/actions/admin';
import { verificationBadges } from '@/lib/verification';

export const metadata: Metadata = { title: 'Verification' };

function Toggle({
  entity,
  id,
  field,
  current,
  onLabel,
  offLabel,
}: {
  entity: string;
  id: string;
  field: string;
  current: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <form action={setVerificationAction}>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!current)} />
      <button
        type="submit"
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
          current
            ? 'border-brand/40 bg-brand/15 text-[#4f6b0a]'
            : 'border-border text-muted-foreground hover:bg-muted'
        }`}
      >
        {current ? offLabel : onLabel}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function EntityRow({
  title,
  subtitle,
  badges,
  children,
}: {
  title: string;
  subtitle?: string | null;
  badges: string[];
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          {badges.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-[#4f6b0a]"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export default async function AdminVerificationPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [clubs, coaches, universities, schools, healthAgents, staff] = await Promise.all([
    prisma.club.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.coach.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.university.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.school.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.healthAgent.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.clubStaff.findMany({
      include: { user: { select: { name: true } }, club: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Verification"
        subtitle="Verify clubs, coaches, schools, universities, health agents and staff for safeguarding."
        icon="shield"
      />
      <p className="mb-6 text-sm text-muted-foreground">
        Badges and background checks decided here are shown across the platform. A club staff
        member needs verification and a background check before contacting players.
      </p>

      <Section title="Clubs">
        {clubs.map((club) => (
          <EntityRow
            key={club.id}
            title={club.name}
            subtitle={club.country}
            badges={verificationBadges({
              verified: club.verified,
              backgroundChecked: club.backgroundChecked,
              safeguardingPolicy: club.safeguardingPolicy,
            })}
          >
            <Toggle
              entity="CLUB"
              id={club.id}
              field="verified"
              current={club.verified}
              onLabel="Verify club"
              offLabel="Revoke"
            />
            <Toggle
              entity="CLUB"
              id={club.id}
              field="backgroundChecked"
              current={club.backgroundChecked}
              onLabel="Background check"
              offLabel="Remove check"
            />
            <Toggle
              entity="CLUB"
              id={club.id}
              field="safeguardingPolicy"
              current={club.safeguardingPolicy}
              onLabel="Add safeguarding policy"
              offLabel="Remove policy"
            />
          </EntityRow>
        ))}
      </Section>

      <Section title="Coaches">
        {coaches.map((coach) => (
          <EntityRow
            key={coach.id}
            title={coach.user.name}
            subtitle={coach.clubName ?? 'Coach'}
            badges={verificationBadges({
              verified: coach.verified,
              backgroundChecked: coach.backgroundChecked,
              safeguardingCertified: coach.safeguardingCertified,
            })}
          >
            <Toggle
              entity="COACH"
              id={coach.id}
              field="verified"
              current={coach.verified}
              onLabel="Verify coach"
              offLabel="Revoke"
            />
            <Toggle
              entity="COACH"
              id={coach.id}
              field="backgroundChecked"
              current={coach.backgroundChecked}
              onLabel="Background check"
              offLabel="Remove check"
            />
            <Toggle
              entity="COACH"
              id={coach.id}
              field="safeguardingCertified"
              current={coach.safeguardingCertified}
              onLabel="Safeguarding"
              offLabel="Remove safeguarding"
            />
          </EntityRow>
        ))}
      </Section>

      <Section title="Universities">
        {universities.map((university) => (
          <EntityRow
            key={university.id}
            title={university.name}
            subtitle={university.country}
            badges={verificationBadges({
              verified: university.verified,
              safeguardingPolicy: university.safeguardingPolicy,
            })}
          >
            <Toggle
              entity="UNIVERSITY"
              id={university.id}
              field="verified"
              current={university.verified}
              onLabel="Verify"
              offLabel="Revoke"
            />
            <Toggle
              entity="UNIVERSITY"
              id={university.id}
              field="safeguardingPolicy"
              current={university.safeguardingPolicy}
              onLabel="Safeguarding policy"
              offLabel="Remove policy"
            />
          </EntityRow>
        ))}
      </Section>

      <Section title="Schools">
        {schools.map((school) => (
          <EntityRow
            key={school.id}
            title={school.name}
            subtitle={school.country}
            badges={verificationBadges({
              verified: school.verified,
              safeguardingPolicy: school.safeguardingPolicy,
            })}
          >
            <Toggle
              entity="SCHOOL"
              id={school.id}
              field="verified"
              current={school.verified}
              onLabel="Verify"
              offLabel="Revoke"
            />
            <Toggle
              entity="SCHOOL"
              id={school.id}
              field="safeguardingPolicy"
              current={school.safeguardingPolicy}
              onLabel="Safeguarding policy"
              offLabel="Remove policy"
            />
          </EntityRow>
        ))}
      </Section>

      <Section title="Health agents">
        {healthAgents.map((agent) => (
          <EntityRow
            key={agent.id}
            title={agent.practiceName}
            subtitle={agent.user.name}
            badges={verificationBadges({
              verified: agent.verified,
              backgroundChecked: agent.backgroundChecked,
            })}
          >
            <Toggle
              entity="HEALTH_AGENT"
              id={agent.id}
              field="verified"
              current={agent.verified}
              onLabel="Verify"
              offLabel="Revoke"
            />
            <Toggle
              entity="HEALTH_AGENT"
              id={agent.id}
              field="backgroundChecked"
              current={agent.backgroundChecked}
              onLabel="Background check"
              offLabel="Remove check"
            />
          </EntityRow>
        ))}
      </Section>

      <Section title="Club staff">
        {staff.map((member) => (
          <EntityRow
            key={member.id}
            title={member.user.name}
            subtitle={`${member.club.name} · ${member.role}`}
            badges={verificationBadges({ backgroundChecked: member.backgroundChecked })}
          >
            <Toggle
              entity="CLUB_STAFF"
              id={member.id}
              field="backgroundChecked"
              current={member.backgroundChecked}
              onLabel="Background check"
              offLabel="Remove check"
            />
          </EntityRow>
        ))}
      </Section>
    </div>
  );
}
