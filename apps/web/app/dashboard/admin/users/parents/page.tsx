import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Parents · Users' };

export default async function AdminUsersParentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parents = await prisma.parent.findMany({
    include: {
      user: true,
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Families"
        subtitle="Parent and guardian accounts linked to players"
        icon="users"
      />
      <RoleLinks />

      {parents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No family members registered.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {parents.map((parent) => (
            <Card key={parent.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{parent.user.name}</p>
                  <p className="text-sm text-muted-foreground">{parent.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Registered on {parent.createdAt.toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {parent._count.children} {parent._count.children === 1 ? 'child' : 'children'}
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
