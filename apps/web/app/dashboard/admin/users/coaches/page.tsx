import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Entrenadores · Users' };

export default async function AdminUsersCoachesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coaches = await prisma.coach.findMany({
    include: {
      user: true,
      _count: { select: { players: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Entrenadores"
        subtitle="Cuentas de coaches y su grupo de jugadores"
        icon="users"
      />
      <RoleLinks />

      {coaches.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay entrenadores registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{coach.user.name}</p>
                  <p className="text-sm text-muted-foreground">{coach.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {coach.clubName ?? 'Sin club asignado'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{coach._count.players} jugadores</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
