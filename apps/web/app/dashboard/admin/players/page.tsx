import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerFilterLinks } from '@/components/admin/player-filter-links';
import { PlayerRow } from '@/components/admin/player-row';

export const metadata: Metadata = { title: 'Jugadores' };

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    where: status ? { status: status as never } : undefined,
    include: { user: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Jugadores"
        subtitle="Profile management, verification and statuses"
        icon="whistle"
      />

      <PlayerFilterLinks />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No players with this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={{
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                status: player.status,
                position: player.position,
                user: { email: player.user.email },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
