import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { POSITION_LABELS, PLAYER_STATUS_LABELS } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { CategoryBars } from '@/components/player/charts';

export const metadata: Metadata = { title: 'Detalle del jugador' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  physical: 'Físico',
  tactical: 'Táctica',
  psychological: 'Psicológica',
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completado',
};

export default async function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: true,
      evaluations: { orderBy: { createdAt: 'desc' }, take: 50 },
      videos: { orderBy: { createdAt: 'desc' }, take: 20 },
      goals: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: {
        select: {
          applications: true,
          savedOpportunities: true,
          submissions: true,
          trials: true,
          contracts: true,
        },
      },
    },
  });
  if (!player) notFound();

  const info: [string, string][] = [
    ['Email', player.user.email],
    ['Fecha de nacimiento', player.dateOfBirth ? player.dateOfBirth.toLocaleDateString('es') : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
    [
      'Posición',
      player.position
        ? (POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position
        : '—',
    ],
    ['Pie dominante', player.foot ?? '—'],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Nivel de competición', player.competitionLevel ?? '—'],
    ['Club actual', player.clubName ?? '—'],
  ];

  const averages = Object.keys(CATEGORY_LABELS).map((category) => {
    const list = player.evaluations.filter((e) => e.category === category);
    const avg =
      list.length > 0 ? list.reduce((sum, e) => sum + e.score, 0) / list.length : 0;
    return { label: CATEGORY_LABELS[category] ?? category, value: Number(avg.toFixed(1)) };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/players"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Jugadores
      </Link>
      <PageHeader
        title={`${player.firstName} ${player.lastName}`}
        subtitle={player.user.email}
        icon="user"
      >
        <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
          {(PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ??
            player.status}
        </Badge>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ['Solicitudes', player._count.applications],
          ['Guardadas', player._count.savedOpportunities],
          ['Envíos', player._count.submissions],
          ['Pruebas', player._count.trials],
          ['Contratos', player._count.contracts],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="text-center">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Perfil</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Media por categoría</h2>
            {player.evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin evaluaciones todavía.</p>
            ) : (
              <CategoryBars items={averages} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Evaluaciones recientes</h2>
            {player.evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin evaluaciones.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {player.evaluations.slice(0, 10).map((evaluation) => (
                  <div key={evaluation.id} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {CATEGORY_LABELS[evaluation.category] ?? evaluation.category}
                      </span>
                      <Badge variant={evaluation.score >= 8 ? 'success' : 'default'}>
                        {evaluation.score}/10
                      </Badge>
                    </div>
                    {evaluation.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{evaluation.notes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {evaluation.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <h2 className="mb-3 font-semibold">Vídeos ({player.videos.length})</h2>
              {player.videos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin vídeos.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {player.videos.slice(0, 8).map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{video.title}</span>
                      <StatusBadge status={video.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="mb-3 font-semibold">Objetivos ({player.goals.length})</h2>
              {player.goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin objetivos.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {player.goals.slice(0, 8).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      <span className="min-w-0 truncate">{goal.title}</span>
                      <Badge variant={goal.status === 'completed' ? 'success' : 'default'}>
                        {GOAL_STATUS_LABELS[goal.status] ?? goal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
