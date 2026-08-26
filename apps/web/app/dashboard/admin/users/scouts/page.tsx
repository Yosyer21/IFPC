import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Ojeadores · Users' };

export default async function AdminUsersScoutsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const scouts = await prisma.scout.findMany({
    include: {
      user: true,
      _count: { select: { scoutingReports: true, savedPlayers: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Ojeadores"
        subtitle="Cuentas de scouts y su actividad de scouting"
        icon="users"
      />
      <RoleLinks />

      {scouts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay ojeadores registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {scouts.map((scout) => (
            <Card key={scout.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{scout.user.name}</p>
                  <p className="text-sm text-muted-foreground">{scout.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {scout.agency ?? 'Agencia no especificada'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{scout._count.scoutingReports} informes</Badge>
                  <Badge variant="outline">{scout._count.savedPlayers} guardados</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
