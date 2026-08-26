import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerFilterLinks } from '@/components/admin/player-filter-links';
import { PlayerRow } from '@/components/admin/player-row';

export const metadata: Metadata = { title: 'Jugadores pendientes' };

export default async function AdminPlayersPendingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    where: { status: 'PENDING_VERIFICATION' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Jugadores pendientes"
        subtitle="Profiles awaiting verification and activation"
        icon="whistle"
      />
      <PlayerFilterLinks />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No players pending verification.
            </p>
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
