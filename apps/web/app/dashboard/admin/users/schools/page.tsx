import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { SCHOOL_TYPE_LABELS } from '@/lib/labels';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Escuelas · Users' };

export default async function AdminUsersSchoolsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const schools = await prisma.school.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Escuelas / Comunidad"
        subtitle="Colegios, clubes escolares y servicios comunitarios con acceso a programas"
        icon="users"
      />
      <RoleLinks />

      {schools.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay escuelas ni servicios comunitarios registrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {schools.map((school) => (
            <Card key={school.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{school.name}</p>
                  <p className="text-sm text-muted-foreground">{school.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {school.city ?? '—'}, {school.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{SCHOOL_TYPE_LABELS[school.type] ?? school.type}</Badge>
                  <Badge variant={school.verified ? 'success' : 'outline'}>
                    {school.verified ? 'Verificada' : 'Pendiente'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
