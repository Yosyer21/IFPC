import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Nivel técnico' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológico',
};

export default async function PlayerTechnicalPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { evaluations: { orderBy: { createdAt: 'desc' } } },
  });
  if (!player) notFound();

  const evaluations = player.evaluations;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Nivel técnico</h1>
      {evaluations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no tienes evaluaciones. Cuando tu entrenador u ojeadores te evalúen, sus notas
              aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="font-semibold">
                      {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                    </h2>
                    {evaluation.evaluatedBy ? (
                      <span className="text-xs text-muted-foreground">
                        por {evaluation.evaluatedBy}
                      </span>
                    ) : null}
                  </div>
                  {evaluation.notes ? (
                    <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
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
