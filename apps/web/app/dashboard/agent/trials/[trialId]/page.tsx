import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Prueba' };

export default async function AgentTrialDetailPage({
  params,
}: {
  params: Promise<{ trialId: string }>;
}) {
  const { trialId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const trial = await prisma.trial.findFirst({
    where: { id: trialId, club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true },
  });
  if (!trial) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/submissions"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Envíos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">Prueba</h1>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Jugador', `${trial.player.firstName} ${trial.player.lastName}`],
              ['Club', trial.club.name],
              ['Inicio', trial.startsAt.toLocaleString('es')],
              ['Fin', trial.endsAt ? trial.endsAt.toLocaleString('es') : '—'],
              ['Ubicación', trial.location ?? '—'],
              ['Estado', trial.status],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {trial.notes ? (
            <p className="mt-4 text-sm text-muted-foreground">{trial.notes}</p>
          ) : null}
          <div className="mt-4">
            <Badge variant={trial.status === 'SCHEDULED' ? 'warning' : 'success'}>
              {trial.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
