import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';
import { IconRoute } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Rutas de mis hijos' };

const PATHWAY_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  completed: 'Completada',
  paused: 'Pausada',
};

export default async function ParentPathwaysPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        include: { player: { include: { pathway: true, goals: true } } },
      },
    },
  });
  if (!parent) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Rutas de desarrollo"
        subtitle="Plan de desarrollo deportivo de cada uno de tus hijos"
        icon="route"
      />

      {parent.children.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't linked any child yet. Link them from 'My children' to see their path.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {parent.children.map(({ player }) => {
            const completed = player.goals.filter((g) => g.status === 'completed').length;
            const progress =
              player.goals.length > 0 ? Math.round((completed / player.goals.length) * 100) : 0;
            return (
              <Card key={player.id} className="card-hover">
                <CardContent className="flex flex-wrap items-center gap-4">
                  <PlayerAvatar firstName={player.firstName} lastName={player.lastName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/parent/children/${player.id}/development`}
                        className="font-semibold hover:underline"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                      {player.pathway ? (
                        <Badge
                          variant={player.pathway.status === 'completed' ? 'success' : 'warning'}
                        >
                          {PATHWAY_STATUS_LABELS[player.pathway.status] ?? player.pathway.status}
                        </Badge>
                      ) : null}
                    </div>

                    {player.pathway ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium">{player.pathway.title}</p>
                        {player.pathway.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {player.pathway.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {completed}/{player.goals.length} objetivos ({progress}%)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No path assigned yet. Goals and assessments will keep building their
                        plan de desarrollo.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {player.pathway?.level ? (
                        <Badge variant="outline">Nivel: {player.pathway.level}</Badge>
                      ) : null}
                      {player.pathway?.focus ? (
                        <Badge variant="outline">Foco: {player.pathway.focus}</Badge>
                      ) : null}
                      <Link
                        href={`/dashboard/parent/children/${player.id}/development`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <IconRoute className="h-3.5 w-3.5" />
                        View development
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


