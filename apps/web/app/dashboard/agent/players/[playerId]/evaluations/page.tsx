import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Evaluaciones del jugador' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológico',
};

export default async function AgentPlayerEvaluationsPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();
  const representation = await prisma.agentPlayer.findUnique({
    where: { agentId_playerId: { agentId: agent.id, playerId } },
  });
  if (!representation) notFound();

  const evaluations = await prisma.evaluation.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/agent/players/${playerId}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Jugador
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Evaluaciones</h1>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay evaluaciones registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                  </h2>
                  {evaluation.notes ? (
                    <p className="mt-1 text-sm text-muted-foreground">{evaluation.notes}</p>
                  ) : null}
                  {evaluation.evaluatedBy ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      por {evaluation.evaluatedBy} · {evaluation.createdAt.toLocaleDateString('es')}
                    </p>
                  ) : null}
                </div>
                <Badge variant="success">{evaluation.score}/10</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
