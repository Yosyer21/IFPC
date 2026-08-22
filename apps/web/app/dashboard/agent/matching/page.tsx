import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { matchScore } from '@ifpc/matching';
import { Badge, Card, CardContent, Progress } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Matching' };

export default async function AgentMatchingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const [representedPlayers, openOpportunities] = await Promise.all([
    prisma.agentPlayer.findMany({
      where: { agentId: agent.id, status: 'ACTIVE' },
      include: { player: true },
    }),
    prisma.opportunity.findMany({ where: { status: 'OPEN' } }),
  ]);

  const matches = representedPlayers
    .map(({ player }) => {
      const best = openOpportunities
        .map((opportunity) => ({
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          clubName: opportunity.clubId,
          ...matchScore(
            {
              position: player.position,
              dateOfBirth: player.dateOfBirth,
              nationality: player.nationality,
              competitionLevel: player.competitionLevel,
              status: player.status,
            },
            {
              position: opportunity.position,
              ageMin: opportunity.ageMin,
              ageMax: opportunity.ageMax,
            }
          ),
        }))
        .sort((a, b) => b.total - a.total)[0] ?? null;
      return { player, best };
    })
    .filter((entry) => entry.best !== null)
    .sort((a, b) => (b.best?.total ?? 0) - (a.best?.total ?? 0));

  // Añadir nombre del club a la mejor oportunidad
  const clubIds = matches
    .map((match) => match.best?.clubName)
    .filter((id): id is string => Boolean(id));
  const clubs = await prisma.club.findMany({ where: { id: { in: clubIds } } });
  const clubNames = new Map(clubs.map((club) => [club.id, club.name]));
  const enriched = matches.map((match) => ({
    ...match,
    clubName: match.best?.clubName ? (clubNames.get(match.best.clubName) ?? 'Club') : null,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Matching"
        subtitle="Jugadores representados ordenados por compatibilidad con oportunidades abiertas"
        icon="target"
      />

      {enriched.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay coincidencias con las oportunidades abiertas en este momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {enriched.map(({ player, best, clubName }) => (
            <Card key={player.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/dashboard/agent/players/${player.id}`}
                    className="font-semibold hover:underline"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                  <Badge variant="warning">{best?.total}/100</Badge>
                </div>
                <div>
                  <Progress value={best?.total ?? 0} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {best?.summary} · Mejor ajuste:{' '}
                  <strong>
                    {best?.opportunityTitle} ({clubName})
                  </strong>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
