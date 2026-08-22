import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';
import { StatCard } from '@/components/player/stat-card';
import {
  IconPlay,
  IconTrendingUp,
  IconUsers,
  IconVideo,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Resumen entrenador' };

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

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default async function CoachDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!coach) notFound();

  const players = await prisma.coachPlayer.findMany({
    where: { coachId: coach.id },
    include: { player: true },
    orderBy: { since: 'desc' },
  });
  const playerIds = players.map((assignment) => assignment.playerId);

  const [evaluations, pendingGoals, videosCount, recentGoals] = await Promise.all([
    prisma.evaluation.findMany({
      where: { playerId: { in: playerIds } },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.playerGoal.count({
      where: { playerId: { in: playerIds }, status: { in: ['pending', 'in_progress'] } },
    }),
    prisma.video.count({ where: { playerId: { in: playerIds } } }),
    prisma.playerGoal.findMany({
      where: { playerId: { in: playerIds } },
      include: { player: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  // Media por categoría (nivel medio de mis jugadores)
  const byCategory = new Map<string, number[]>();
  for (const evaluation of evaluations) {
    const list = byCategory.get(evaluation.category) ?? [];
    list.push(evaluation.score);
    byCategory.set(evaluation.category, list);
  }
  const radarCategories: string[] = [];
  const radarValues: number[] = [];
  for (const [category, scores] of byCategory) {
    radarCategories.push(CATEGORY_LABELS[category] ?? category);
    radarValues.push(Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10);
  }

  // Media global de todos los jugadores
  const overall =
    evaluations.length > 0
      ? Math.round(
          (evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) /
            evaluations.length) *
            10
        ) / 10
      : null;

  const stats = [
    { href: '/dashboard/coach/players', icon: IconUsers, label: 'Jugadores asignados', value: players.length },
    { href: '/dashboard/coach/evaluations', icon: IconWhistle, label: 'Evaluaciones', value: evaluations.length },
    { href: '/dashboard/coach/players', icon: IconTrendingUp, label: 'Objetivos activos', value: pendingGoals },
    { href: '/dashboard/coach/players', icon: IconVideo, label: 'Vídeos de mis jugadores', value: videosCount },
  ];

  const registerHref =
    players.length > 0
      ? `/dashboard/coach/players/${players[0]!.playerId}/evaluations`
      : '/dashboard/coach/players';

  const quickActions = [
    { href: '/dashboard/coach/players', icon: IconUsers, label: 'Mis jugadores' },
    { href: registerHref, icon: IconWhistle, label: 'Registrar evaluación' },
    { href: '/dashboard/coach/evaluations', icon: IconTrendingUp, label: 'Evaluaciones' },
    { href: '/dashboard/coach/training', icon: IconPlay, label: 'Entrenamiento' },
  ];

  const activity = [
    ...recentGoals.map((goal) => ({
      key: goal.id,
      icon: IconTrendingUp,
      title: goal.title,
      meta: `${goal.player.firstName} ${goal.player.lastName} · ${GOAL_STATUS_LABELS[goal.status] ?? goal.status}`,
      date: goal.createdAt,
    })),
    ...evaluations.slice(0, 5).map((evaluation) => ({
      key: evaluation.id,
      icon: IconWhistle,
      title: CATEGORY_LABELS[evaluation.category] ?? evaluation.category,
      meta: `${evaluation.player.firstName} ${evaluation.player.lastName} · ${evaluation.score}/10`,
      date: evaluation.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const [coachFirstName = 'Entrenador', coachLastName = ''] = coach.user.name.split(' ');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PlayerAvatar firstName={coachFirstName} lastName={coachLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting()}, {coachFirstName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Entrenador
              </span>
              {coach.clubName ? <Badge>{coach.clubName}</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestiona el desarrollo de tus jugadores
              {players.length > 0
                ? ` · ${players.length} jugador${players.length === 1 ? '' : 'es'} a tu cargo`
                : ' · aún sin jugadores asignados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/coach/players"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Ver jugadores
            </Link>
            <Link
              href={registerHref}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Registrar evaluación
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="animate-fade-up flex items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <Icon className="h-4 w-4 text-primary" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={80 + i * 70} />
        ))}
      </div>
      {/* Radar + media global */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '320ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Nivel medio por categoría</h2>
              {evaluations.length > 0 ? (
                <Link
                  href="/dashboard/coach/evaluations"
                  className="text-sm text-primary hover:underline"
                >
                  Ver evaluaciones →
                </Link>
              ) : null}
            </div>
            {radarValues.length >= 3 ? (
              <div className="animate-scale-in mx-auto max-w-sm">
                <RadarChart categories={radarCategories} values={radarValues} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconWhistle className="h-7 w-7" />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Cuando registres evaluaciones de tus jugadores, aquí verás el nivel medio del
                  grupo en técnica, físico, táctica y psicología.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-fade-up flex flex-col items-center"
          style={{ animationDelay: '400ms' }}
        >
          <CardContent className="flex w-full flex-col items-center gap-4">
            <h2 className="self-start font-semibold">Media global del grupo</h2>
            {overall !== null ? (
              <>
                <DonutChart
                  value={overall * 10}
                  label={`${overall}`}
                  sublabel={`sobre 10 · ${evaluations.length} evaluaciones`}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Puntuación media de todos los jugadores a tu cargo.
                </p>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay evaluaciones registradas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card className="animate-fade-up mt-6" style={{ animationDelay: '480ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Actividad reciente</h2>
            <Link
              href="/dashboard/coach/evaluations"
              className="text-sm text-primary hover:underline"
            >
              Ver evaluaciones →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay actividad. Accede a un jugador y registra su primera evaluación u objetivo.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{item.meta}</div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.date.toLocaleDateString('es')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Mis jugadores */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis jugadores</h2>
          {players.length > 0 ? (
            <Link href="/dashboard/coach/players" className="text-sm text-primary hover:underline">
              Ver todos →
            </Link>
          ) : null}
        </div>
        {players.length === 0 ? (
          <Card className="animate-fade-up">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aún no tienes jugadores asignados. Cuando la plataforma te vincule jugadores,
                aparecerán aquí para que puedas evaluarlos y asignarles objetivos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map(({ player }, i) => (
              <Link
                key={player.id}
                href={`/dashboard/coach/players/${player.id}`}
                className="animate-fade-up group block"
                style={{ animationDelay: `${520 + i * 60}ms` }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="flex items-center gap-3">
                    <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {player.position ?? 'Sin posición'}
                        {player.clubName ? ` · ${player.clubName}` : ''}
                      </div>
                    </div>
                    <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                      {player.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



