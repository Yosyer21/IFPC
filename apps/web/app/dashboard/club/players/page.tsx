import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
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
        subtitle="Profiles open to new opportunities on the platform"
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
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold leading-snug">
                      {player.firstName} {player.lastName}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="fb-tag fb-tag-gray">
                        {player.position
                          ? ((POSITION_LABELS as Record<string, string | undefined>)[
                              player.position
                            ] ?? player.position)
                          : 'Undefined position'}
                      </span>
                      {player.heightCm ? (
                        <span className="text-xs text-muted-foreground">{player.heightCm} cm</span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {player.nationality ? (
                        <span className="fb-tag fb-tag-blue">{player.nationality}</span>
                      ) : null}
                      <span
                        className={`fb-tag ${
                          player.videos.length > 0 ? 'fb-tag-lime' : 'fb-tag-gray'
                        }`}
                      >
                        {player.videos.length > 0
                          ? `${player.videos.length} video(s)`
                          : 'No videos'}
                      </span>
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
