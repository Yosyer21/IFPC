import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Mis jugadores' };

export default async function CoachPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) notFound();

  const players = await prisma.coachPlayer.findMany({
    where: { coachId: coach.id },
    include: { player: true },
    orderBy: { since: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Mis jugadores"
        subtitle="Jugadores vinculados a ti para su seguimiento y desarrollo"
        icon="users"
      />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no tienes jugadores asignados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {players.map(({ player }) => {
            const age = player.dateOfBirth
              ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null;
            const positionLabel = player.position
              ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                player.position)
              : '—';
            return (
              <Link
                key={player.id}
                href={`/dashboard/coach/players/${player.id}`}
                className="group"
              >
                <Card className="card-hover transition-colors">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">
                          {player.firstName} {player.lastName}
                        </h2>
                        <p className="truncate text-sm text-muted-foreground">
                          {positionLabel}
                          {age !== null ? ` · ${age} años` : ''}
                          {player.clubName ? ` · ${player.clubName}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                      {player.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


