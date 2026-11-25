import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { affinityScore } from '@ifpc/matching';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { AffinityBadge } from '@/components/player/match-score';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { buildAffinityTarget } from '@/lib/affinity';
import { canShowStatsAndClips, isVisibleToSchools } from '@/lib/minor';

export const metadata: Metadata = { title: 'Players' };

export default async function UniversityPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [university, players] = await Promise.all([
    prisma.university.findUnique({
      where: { userId: session.user.id },
      include: {
        opportunities: {
          where: { status: 'OPEN' },
          select: { position: true, ageMin: true, ageMax: true },
        },
      },
    }),
    prisma.player.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        parents: { select: { idVisibleToSchools: true, showStatsAndClips: true } },
        _count: { select: { videos: true, filmClips: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
  ]);

  // Solo menores de 16 cuyo padre ha desactivado la visibilidad para colegios.
  const visiblePlayers = players.filter((player) =>
    isVisibleToSchools(player.dateOfBirth, player.parents)
  );

  const career = visiblePlayers.length
    ? await prisma.careerEntry.groupBy({
        by: ['playerId'],
        where: { playerId: { in: visiblePlayers.map((player) => player.id) } },
        _sum: { appearances: true, goals: true, assists: true },
      })
    : [];
  const careerByPlayer = new Map(career.map((row) => [row.playerId, row._sum]));

  const target = buildAffinityTarget(
    {
      kind: 'university',
      name: university?.name ?? 'Your programme',
      country: university?.country ?? null,
      city: university?.city ?? null,
    },
    university?.opportunities ?? []
  );

  const rows = visiblePlayers
    .map((player) => {
      const sum = careerByPlayer.get(player.id);
      const showDetails = canShowStatsAndClips(player.dateOfBirth, player.parents);
      const affinity = affinityScore(
        {
          position: player.position,
          dateOfBirth: player.dateOfBirth,
          nationality: player.nationality,
          location: player.location,
          clubName: player.clubName,
          competitionLevel: player.competitionLevel,
          // Privacidad: stats/clips ocultos por el padre de un menor no se usan.
          appearances: showDetails ? (sum?.appearances ?? 0) : null,
          goalContributions: showDetails ? (sum?.goals ?? 0) + (sum?.assists ?? 0) : null,
          highlights: showDetails ? player._count.videos + player._count.filmClips : null,
        },
        target
      );
      return { player, affinity };
    })
    .sort(
      (a, b) =>
        b.affinity.total - a.affinity.total ||
        a.player.lastName.localeCompare(b.player.lastName)
    );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Available players"
        subtitle="Talent open to new opportunities, sorted by affinity with your programme"
        icon="users"
      />

      {rows.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No players available right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ player, affinity }, i) => {
            const positionLabel = player.position
              ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                player.position)
              : 'No position';
            return (
              <Card
                key={player.id}
                className="card-hover animate-fade-up h-full"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="flex items-center gap-3">
                  <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">
                      {player.firstName} {player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">{positionLabel}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="success">Available</Badge>
                      <AffinityBadge score={affinity.total} />
                      {player.nationality ? (
                        <span className="text-xs text-muted-foreground">{player.nationality}</span>
                      ) : null}
                      {player.heightCm ? (
                        <span className="text-xs text-muted-foreground">{player.heightCm} cm</span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
