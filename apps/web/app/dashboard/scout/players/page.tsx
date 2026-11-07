import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { savePlayerAction } from '@/app/actions/scout';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Search players' };

export default async function ScoutPlayersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const scout = await prisma.scout.findUnique({ where: { userId: session.user.id } });
  if (!scout) notFound();

  const [players, saved] = await Promise.all([
    prisma.player.findMany({
      where: { status: 'AVAILABLE' },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.savedPlayer.findMany({ where: { scoutId: scout.id } }),
  ]);

  const savedIds = new Set(saved.map((entry) => entry.playerId));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Search players"
        subtitle="Profiles available for your scouting radar"
        icon="search"
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
            <Card key={player.id} className="card-hover h-full">
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
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
                          : 'No position'}
                      </span>
                      {player.heightCm ? (
                        <span className="text-xs text-muted-foreground">{player.heightCm} cm</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <form action={savePlayerAction} className="mt-auto">
                  <input type="hidden" name="playerId" value={player.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      savedIds.has(player.id)
                        ? 'border-[#4f6b0a]/40 bg-brand/10 text-[#4f6b0a] hover:bg-brand/15'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {savedIds.has(player.id) ? '★ Saved' : 'Save'}
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
