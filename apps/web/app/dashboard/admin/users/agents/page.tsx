import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Agentes · Users' };

export default async function AdminUsersAgentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agents = await prisma.agent.findMany({
    include: {
      user: true,
      _count: { select: { players: true, submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Agentes"
        subtitle="Agencias y representantes con jugadores vinculados"
        icon="users"
      />
      <RoleLinks />

      {agents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay agentes registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{agent.user.name}</p>
                  <p className="text-sm text-muted-foreground">{agent.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.agency ?? 'Agencia no especificada'} · Licencia:{' '}
                    {agent.license ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{agent._count.players} representados</Badge>
                  <Badge variant="outline">{agent._count.submissions} submissions</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
