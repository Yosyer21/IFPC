import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Jugadores' };

export default async function UniversityPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Available players"
        subtitle="Talento abierto a nuevas oportunidades para reclutar"
        icon="users"
      />

      {players.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No players available right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player, i) => {
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
                      <Badge variant="success">Disponible</Badge>
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
