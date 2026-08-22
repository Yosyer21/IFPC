import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Pruebas' };

export default async function AgentTrialsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const trials = await prisma.trial.findMany({
    where: { club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true },
    orderBy: { startsAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Pruebas"
        subtitle="Pruebas programadas para tus jugadores con clubes"
        icon="whistle"
      />

      {trials.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay pruebas programadas. Cuando un club confirme una prueba tras un envío,
              aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {trials.map((trial, i) => (
            <Link
              key={trial.id}
              href={`/dashboard/agent/trials/${trial.id}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card className="card-hover">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {trial.player.firstName} {trial.player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {trial.club.name}
                      {trial.location ? ` · ${trial.location}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {trial.startsAt.toLocaleDateString('es')}
                      {trial.endsAt ? ` → ${trial.endsAt.toLocaleDateString('es')}` : ''}
                    </p>
                  </div>
                  <Badge variant={trial.status === 'SCHEDULED' ? 'warning' : 'success'}>
                    {trial.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
