import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Mis jugadores' };

export default async function AgentPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const players = await prisma.agentPlayer.findMany({
    where: { agentId: agent.id, status: 'ACTIVE' },
    include: { player: { include: { user: true } } },
    orderBy: { since: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Mis jugadores" icon="users">
        <Link
          href="/dashboard/agent/players/add"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Añadir jugador
        </Link>
      </PageHeader>

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no representas a ningún jugador.{' '}
              <Link href="/dashboard/agent/players/add" className="text-primary hover:underline">
                Añade tu primer jugador
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((entry) => (
            <Link
              key={entry.id}
              href={`/dashboard/agent/players/${entry.playerId}`}
              className="group"
            >
              <Card className="card-hover h-full">
                <CardContent className="flex items-center gap-3">
                  <PlayerAvatar
                    firstName={entry.player.firstName}
                    lastName={entry.player.lastName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {entry.player.firstName} {entry.player.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {entry.player.position
                        ? ((POSITION_LABELS as Record<string, string | undefined>)[
                            entry.player.position
                          ] ?? entry.player.position)
                        : 'Posición sin definir'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="success">{entry.player.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Desde {entry.since.toLocaleDateString('es')}
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
