import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'My players' };

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
      <PageHeader title="My players" icon="users">
        <Link
          href="/dashboard/agent/players/add"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:brightness-95"
        >
          Add player
        </Link>
      </PageHeader>

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You don't represent any player yet.{' '}
              <Link href="/dashboard/agent/players/add" className="text-[#4f6b0a] hover:underline">
                Add your first player
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
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold leading-snug">
                      {entry.player.firstName} {entry.player.lastName}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="fb-tag fb-tag-gray">
                        {entry.player.position
                          ? ((POSITION_LABELS as Record<string, string | undefined>)[
                              entry.player.position
                            ] ?? entry.player.position)
                          : 'Undefined position'}
                      </span>
                      <StatusBadge status={entry.player.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Since {entry.since.toLocaleDateString('en-GB')}
                    </p>
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
