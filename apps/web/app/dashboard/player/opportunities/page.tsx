import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, Tabs } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { MatchScoreBadge } from '@/components/player/match-score';
import { TransferWindow } from '@/components/player/transfer-window';
import { PLAYER_MATCH_THRESHOLD, matchOpportunity } from '@/lib/matching';
import { playerProfileChecklist } from '@/lib/player';
import {
  applicationFromRow,
  matchFromOpportunity,
  offerFromNegotiation,
  offerFromTrial,
  transferWindowStats,
} from '@/lib/transfer-window';

export const metadata: Metadata = { title: 'Opportunities' };

export default async function PlayerOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { image: true } },
      _count: { select: { career: true, videos: true } },
    },
  });
  if (!player) notFound();

  const [opportunities, applications, trials, negotiations] = await Promise.all([
    prisma.opportunity.findMany({
      where: { status: 'OPEN' },
      include: { club: true, university: true },
    }),
    prisma.application.findMany({
      where: { playerId: player.id },
      include: { opportunity: { include: { club: true, university: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // Invitaciones a prueba: la vía real por la que un club contacta al jugador.
    prisma.trial.findMany({
      where: { playerId: player.id, status: 'SCHEDULED' },
      include: { club: true, submission: true },
      orderBy: { startsAt: 'asc' },
      take: 20,
    }),
    // Ofertas de contrato abiertas (el club ya dio el paso).
    prisma.negotiation.findMany({
      where: { playerId: player.id, status: { in: ['OPEN', 'ONGOING'] } },
      include: { club: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  // Best matches first: the matching engine already exists and was unused here.
  const matches = opportunities
    .map((opportunity) => ({ opportunity, match: matchOpportunity(player, opportunity) }))
    .sort(
      (a, b) =>
        b.match.total - a.match.total ||
        b.opportunity.createdAt.getTime() - a.opportunity.createdAt.getTime()
    );
  const goodMatches = matches.filter((m) => m.match.total >= PLAYER_MATCH_THRESHOLD).length;

  // Vista «Transfer window»: todo normalizado y serializable para el cliente.
  const now = new Date();
  const offers = [
    ...trials.map((trial) => offerFromTrial(trial, now)),
    ...negotiations.map((negotiation) => offerFromNegotiation(negotiation, now)),
  ];
  const transferMatches = matches.map(({ opportunity, match }) =>
    matchFromOpportunity(opportunity, match.total, now)
  );
  const transferApplications = applications.map((application) =>
    applicationFromRow(application, now)
  );
  const stats = transferWindowStats({
    offers,
    matches: transferMatches,
    applications: transferApplications,
  });

  // Siguiente mejor paso del perfil (el CTA de «Profile strength»).
  const checklist = playerProfileChecklist({
    ...player,
    image: player.user.image,
    careerCount: player._count.career,
  });
  const nextStep = !player._count.videos
    ? {
        label: 'Add clip',
        href: '/dashboard/discovery',
        hint: 'Add a highlight clip so scouts and coaches can see how you play.',
      }
    : checklist.next
      ? { label: checklist.next.label, href: checklist.next.href, hint: checklist.next.hint }
      : {
          label: 'View profile',
          href: '/dashboard/player/profile',
          hint: 'Your profile is complete. Keep your clips and stats up to date.',
        };

  const openOpportunities =
    matches.length === 0 ? (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There are no open opportunities at the moment. Come back soon.
          </p>
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(({ opportunity, match }) => (
          <Link
            key={opportunity.id}
            href={`/dashboard/player/opportunities/${opportunity.id}`}
            className="group"
          >
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge>
                    {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                      opportunity.type
                    ] ?? opportunity.type}
                  </Badge>
                  <MatchScoreBadge score={match.total} />
                </div>
                <h2 className="font-semibold">{opportunity.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">{match.summary}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {opportunity.position ? <span>Position: {opportunity.position}</span> : null}
                  {opportunity.location ? <span>{opportunity.location}</span> : null}
                  {opportunity.closesAt ? (
                    <span>Closes: {opportunity.closesAt.toLocaleDateString('en-GB')}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Opportunities"
        subtitle={
          matches.length === 0
            ? 'No open opportunities right now'
            : `${stats.offersWaiting} offers waiting · ${stats.matches} matches · ${stats.applications} applications`
        }
        icon="target"
      >
        <Link
          href="/dashboard/player/opportunities/saved"
          className="text-sm text-muted-foreground hover:underline"
        >
          Saved →
        </Link>
        {goodMatches > 0 ? (
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-[#4f6b0a]">
            {goodMatches} strong matches
          </span>
        ) : null}
      </PageHeader>

      <Tabs
        defaultValue="window"
        tabs={[
          {
            value: 'window',
            label: 'Transfer window',
            content: (
              <TransferWindow
                offers={offers}
                matches={transferMatches}
                applications={transferApplications}
                profileStrength={checklist.percent}
                nextStep={nextStep}
              />
            ),
          },
          {
            value: 'all',
            label: `All opportunities (${matches.length})`,
            content: openOpportunities,
          },
        ]}
      />
    </div>
  );
}
