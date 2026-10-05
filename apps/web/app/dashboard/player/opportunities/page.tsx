import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { MatchScoreBadge } from '@/components/player/match-score';
import { PLAYER_MATCH_THRESHOLD, matchOpportunity } from '@/lib/matching';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function PlayerOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
  });

  // Best matches first: the matching engine already exists and was unused here.
  const matches = opportunities
    .map((opportunity) => ({ opportunity, match: matchOpportunity(player, opportunity) }))
    .sort(
      (a, b) =>
        b.match.total - a.match.total ||
        b.opportunity.createdAt.getTime() - a.opportunity.createdAt.getTime()
    );
  const goodMatches = matches.filter((m) => m.match.total >= PLAYER_MATCH_THRESHOLD).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Oportunidades"
        subtitle={
          goodMatches > 0
            ? `${goodMatches} de ${matches.length} encajan con tu perfil`
            : `${matches.length} oportunidades abiertas`
        }
        icon="target"
      >
        <Link
          href="/dashboard/player/opportunities/applications"
          className="text-sm text-muted-foreground hover:underline"
        >
          My applications →
        </Link>
      </PageHeader>

      {matches.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay oportunidades abiertas en este momento. Vuelve pronto.
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
                      <span>Cierra: {opportunity.closesAt.toLocaleDateString('es')}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
