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
        subtitle="Profilees disponibles para tu radar de scouting"
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
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {player.firstName} {player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {player.position
                        ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                          player.position)
                        : 'No position'}
                      {player.heightCm ? ` · ${player.heightCm} cm` : ''}
                    </p>
                  </div>
                </div>
                <form action={savePlayerAction}>
                  <input type="hidden" name="playerId" value={player.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      savedIds.has(player.id)
                        ? 'border-emerald-600/40 text-emerald-600 hover:bg-muted'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {savedIds.has(player.id) ? '★ Guardado' : 'Guardar'}
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
