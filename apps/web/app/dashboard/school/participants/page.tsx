import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Participantes' };

export default async function SchoolParticipantsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const school = await prisma.school.findUnique({ where: { userId: session.user.id } });
  if (!school) return null;

  const players = await prisma.player.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Participantes"
        subtitle="Jugadoras que pueden incorporarse a vuestros programas y clínicas"
        icon="users"
      />

      {players.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay jugadoras disponibles todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {players.map((player) => {
            const positionLabel = player.position
              ? (POSITION_LABELS[player.position as keyof typeof POSITION_LABELS] ?? player.position)
              : 'Sin posición';
            return (
              <Card key={player.id} className="card-hover animate-fade-up">
                <CardContent className="flex items-center gap-3">
                  <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {positionLabel}
                      {player.nationality ? ` · ${player.nationality}` : ''}
                    </div>
                  </div>
                  <Badge variant="success">Disponible</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
