import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Mis hijos' };

export default async function ParentChildrenPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) notFound();

  const children = await prisma.parentChild.findMany({
    where: { parentId: parent.id },
    include: { player: true },
    orderBy: { since: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Mis hijos"
        subtitle="Jugadores vinculados a tu cuenta familiar"
        icon="users"
      />

      {children.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no tienes hijos vinculados. Cuando un jugador acepte tu invitación familiar,
              aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map(({ player }, i) => {
            const age = player.dateOfBirth
              ? Math.floor(
                  (Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                )
              : null;
            const positionLabel = player.position
              ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                player.position)
              : '—';
            return (
              <Link
                key={player.id}
                href={`/dashboard/parent/children/${player.id}`}
                className="animate-fade-up group block"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="flex items-center gap-3">
                    <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">
                        {player.firstName} {player.lastName}
                      </h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {positionLabel}
                        {age !== null ? ` · ${age} años` : ''}
                      </p>
                      {player.clubName ? (
                        <p className="truncate text-xs text-muted-foreground">{player.clubName}</p>
                      ) : null}
                    </div>
                    <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                      {player.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
