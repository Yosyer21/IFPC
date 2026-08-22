import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Universidades · Usuarios' };

export default async function AdminUsersUniversitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const universities = await prisma.university.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Universidades"
        subtitle="Instituciones académicas con acceso a reclutamiento"
        icon="users"
      />
      <RoleLinks />

      {universities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay universidades registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {universities.map((university) => (
            <Card key={university.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{university.name}</p>
                  <p className="text-sm text-muted-foreground">{university.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {university.city ?? '—'}, {university.country}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
