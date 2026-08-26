import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerFilterLinks } from '@/components/admin/player-filter-links';
import { PlayerRow } from '@/components/admin/player-row';

export const metadata: Metadata = { title: 'Jugadores activos' };

export default async function AdminPlayersActivePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    where: { status: { in: ['ACTIVE', 'AVAILABLE'] } },
    include: { user: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Jugadores activos"
        subtitle="Profilees activos y disponibles para reclutamiento"
        icon="whistle"
      />
      <PlayerFilterLinks />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No active players.</p>
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
