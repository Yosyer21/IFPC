import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Clubes · Usuarios' };

export default async function AdminUsersClubsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubs = await prisma.club.findMany({
    include: {
      user: true,
      _count: { select: { opportunities: true, requirements: true, inquiries: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clubes"
        subtitle="Entidades registradas en la plataforma"
        icon="users"
      />
      <RoleLinks />

      {clubs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay clubes registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {clubs.map((club) => (
            <Card key={club.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{club.name}</p>
                  <p className="text-sm text-muted-foreground">{club.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {club.city ?? '—'}, {club.country} · {club.league ?? 'Sin liga'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={club.verified ? 'success' : 'warning'}>
                    {club.verified ? 'Verificado' : 'Pendiente'}
                  </Badge>
                  <Badge variant="outline">{club._count.opportunities} oportunidades</Badge>
                  <Badge variant="outline">{club._count.requirements} requisitos</Badge>
                  <Badge variant="outline">{club._count.inquiries} consultas</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
