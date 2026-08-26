import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PLAYER_STATUS_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Jugadores · Users' };

export default async function AdminUsersPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const players = await prisma.player.findMany({
    include: {
      user: true,
      _count: { select: { videos: true, evaluations: true, applications: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Jugadores"
        subtitle="Cuentas de jugadores de la plataforma"
        icon="users"
      />
      <RoleLinks />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No registered players.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Card key={player.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{player.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {player.position ?? 'No position'} · {player.nationality ?? '—'} ·{' '}
                    {player.competitionLevel ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                    {(PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ??
                      player.status}
                  </Badge>
                  <Badge variant="outline">{player._count.videos} videos</Badge>
                  <Badge variant="outline">{player._count.evaluations} eval.</Badge>
                  <Badge variant="outline">{player._count.applications} solicitudes</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
