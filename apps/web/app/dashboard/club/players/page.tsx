import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Available players' };

export default async function ClubPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const players = await prisma.player.findMany({
    where: { status: 'AVAILABLE' },
    include: { user: true, videos: { take: 1 } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Available players"
        subtitle="Profilees abiertos a nuevas oportunidades en la plataforma"
        icon="users"
      />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No players available right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/dashboard/club/players/${player.id}`}
              className="group"
            >
              <Card className="card-hover h-full">
                <CardContent className="flex items-center gap-3">
                  <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {player.firstName} {player.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {player.position
                        ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                          player.position)
                        : 'Undefined position'}
                      {player.heightCm ? ` · ${player.heightCm} cm` : ''}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge>{player.nationality ?? '—'}</Badge>
                      <Badge variant="success">
                        {player.videos.length > 0 ? `${player.videos.length} video(s)` : 'No videos'}
                      </Badge>
                    </div>
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
