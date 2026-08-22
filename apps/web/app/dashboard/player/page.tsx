import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  COMPETITION_LEVEL_LABELS,
  PLAYER_STATUS_LABELS,
  POSITION_LABELS,
} from '@ifpc/config';
import { PlayerAvatar } from '@/components/player/avatar';
import { DonutChart, RadarChart } from '@/components/player/charts';
import { StatCard } from '@/components/player/stat-card';
import {
  IconPlay,
  IconRoute,
  IconTarget,
  IconTrendingUp,
  IconVideo,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Mi área' };

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

export default async function PlayerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!player) notFound();

  const [videos, pendingGoals, opportunities, unreadNotifications, membership, evaluations, recentGoals] =
    await Promise.all([
      prisma.video.count({ where: { playerId: player.id } }),
      prisma.playerGoal.count({
        where: { playerId: player.id, status: { in: ['pending', 'in_progress'] } },
      }),
      prisma.opportunity.count({ where: { status: 'OPEN' } }),
      prisma.notification.count({ where: { userId: session.user.id, read: false } }),
      prisma.membership.findUnique({ where: { userId: session.user.id } }),
      prisma.evaluation.findMany({ where: { playerId: player.id }, orderBy: { createdAt: 'desc' } }),
      prisma.playerGoal.findMany({
        where: { playerId: player.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

  const statusLabel =
    (PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ?? player.status;
  const positionLabel = player.position
    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ?? player.position)
    : 'Sin posición definida';
  const competitionLabel = player.competitionLevel
    ? ((COMPETITION_LEVEL_LABELS as Record<string, string | undefined>)[player.competitionLevel] ??
      player.competitionLevel)
    : null;

  // % de perfil completado
  const fields = [
    player.firstName,
    player.lastName,
    player.dateOfBirth,
    player.nationality,
    player.position,
    player.foot,
    player.heightCm,
    player.weightKg,
    player.competitionLevel,
    player.clubName,
    player.bio,
  ];
  const completedFields = fields.filter(Boolean).length;
  const percent = Math.round((completedFields / fields.length) * 100);

  // Media por categoría para el radar
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

  const stats = [
    { href: '/dashboard/player/videos', icon: IconVideo, label: 'Vídeos', value: videos },
    { href: '/dashboard/player/development/goals', icon: IconTrendingUp, label: 'Objetivos activos', value: pendingGoals },
    { href: '/dashboard/player/development/evaluations', icon: IconWhistle, label: 'Evaluaciones', value: evaluations.length },
    { href: '/dashboard/player/opportunities', icon: IconTarget, label: 'Oportunidades abiertas', value: opportunities },
  ];

  const quickActions = [
    { href: '/dashboard/player/training', icon: IconPlay, label: 'Entrenar' },
    { href: '/dashboard/player/videos/upload', icon: IconVideo, label: 'Subir vídeo' },
    { href: '/dashboard/player/opportunities', icon: IconTarget, label: 'Buscar oportunidades' },
    { href: '/dashboard/player/pathway', icon: IconRoute, label: 'Mi ruta' },
  ];

  const activity = [
    ...recentGoals.map((goal) => ({
      key: goal.id,
      icon: IconTrendingUp,
      title: goal.title,
      meta: `Objetivo · ${GOAL_STATUS_LABELS[goal.status] ?? goal.status}`,
      date: goal.createdAt,
    })),
    ...evaluations.slice(0, 3).map((evaluation) => ({
      key: evaluation.id,
      icon: IconWhistle,
      title: CATEGORY_LABELS[evaluation.category] ?? evaluation.category,
      meta: `Evaluación · ${evaluation.score}/10${
        evaluation.evaluatedBy ? ` · ${evaluation.evaluatedBy}` : ''
      }`,
      date: evaluation.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting()}, {player.firstName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                {statusLabel}
              </span>
              {membership && membership.tier !== 'FREE' ? (
                <Badge variant="success">{membership.tier}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {positionLabel}
              {competitionLabel ? ` · ${competitionLabel}` : ''}
              {player.clubName ? ` · ${player.clubName}` : ''}
              {unreadNotifications > 0 ? ` · ${unreadNotifications} notificaciones sin leer` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/player/profile/edit"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Editar perfil
            </Link>
            <Link
              href="/dashboard/player/scouting"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Ver perfil público
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
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
          <StatCard key={stat.href} {...stat} delay={80 + i * 70} />
        ))}
      </div>
      {/* Radar + perfil completado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '320ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Nivel por categoría</h2>
              {evaluations.length > 0 ? (
                <Link
                  href="/dashboard/player/development/evaluations"
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
                  Cuando tu entrenador u ojeadores te evalúen, aquí verás tu nivel técnico, físico,
                  táctico y psicológico.
                </p>
                <Link
                  href="/dashboard/player/development/progress"
                  className="text-sm text-primary hover:underline"
                >
                  Ver mi progreso →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="animate-fade-up flex flex-col items-center"
          style={{ animationDelay: '400ms' }}
        >
          <CardContent className="flex w-full flex-col items-center gap-4">
            <h2 className="self-start font-semibold">Perfil completado</h2>
            <DonutChart
              value={percent}
              label={`${percent}%`}
              sublabel={`${completedFields}/${fields.length} campos`}
            />
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-sm text-muted-foreground">
                {percent === 100
                  ? '¡Perfil completo! Ya puedes aparecer en las búsquedas de clubes y ojeadores.'
                  : 'Completa tu perfil para destacar ante clubes y ojeadores.'}
              </p>
              {percent < 100 ? (
                <Link
                  href="/dashboard/player/profile/edit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
                >
                  Completar perfil
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card className="animate-fade-up mt-6" style={{ animationDelay: '480ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Actividad reciente</h2>
            <Link
              href="/dashboard/player/notifications"
              className="text-sm text-primary hover:underline"
            >
              Ver notificaciones →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay actividad. Sube un vídeo, aplica a una oportunidad o entrena para empezar.
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
    </div>
  );
}


