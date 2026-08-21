import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Jugadores guardados' };

export default async function ScoutSavedPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const scout = await prisma.scout.findUnique({ where: { userId: session.user.id } });
  if (!scout) notFound();

  const saved = await prisma.savedPlayer.findMany({
    where: { scoutId: scout.id },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Jugadores guardados"
        subtitle="Tu radar de talento: jugadores que sigues de cerca"
        icon="star"
      />

      {saved.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No has guardado jugadores.{' '}
              <Link href="/dashboard/scout/players" className="text-primary hover:underline">
                Explorar jugadores
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((entry) => (
            <Card key={entry.id} className="card-hover">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <PlayerAvatar
                    firstName={entry.player.firstName}
                    lastName={entry.player.lastName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {entry.player.firstName} {entry.player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {entry.player.position
                        ? ((POSITION_LABELS as Record<string, string | undefined>)[
                            entry.player.position
                          ] ?? entry.player.position)
                        : 'Sin posición'}
                      {' · '}
                      Guardado el {entry.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                </div>
                <Badge variant="success">{entry.player.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
