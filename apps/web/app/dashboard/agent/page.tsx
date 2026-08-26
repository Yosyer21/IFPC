import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { POSITION_LABELS } from '@ifpc/config';
import { StatCard } from '@/components/player/stat-card';
import { CountUp } from '@/components/player/count-up';
import { PlayerAvatar } from '@/components/player/avatar';
import {
  IconBell,
  IconBriefcase,
  IconFile,
  IconMail,
  IconShield,
  IconTarget,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Mi agencia' };

const STAGE_LABELS: Record<string, string> = {
  SUBMISSION: 'Submission',
  TRIAL: 'Prueba',
  NEGOTIATION: 'Negotiation',
  CONTRACT: 'Contrato',
};

export default async function AgentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!agent) notFound();

  const [players, submissions, trials, negotiations, contracts] = await Promise.all([
    prisma.agentPlayer.findMany({
      where: { agentId: agent.id, status: 'ACTIVE' },
      include: { player: true },
      orderBy: { since: 'desc' },
    }),
    prisma.submission.findMany({
      where: { agentId: agent.id },
      include: { player: true, club: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trial.findMany({
      where: { club: { submissions: { some: { agentId: agent.id } } } },
      include: { player: true, club: true },
      orderBy: { startsAt: 'desc' },
    }),
    prisma.negotiation.findMany({
      where: { club: { submissions: { some: { agentId: agent.id } } } },
      include: { player: true, club: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contract.findMany({
      where: { club: { submissions: { some: { agentId: agent.id } } } },
      include: { player: true, club: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const scheduledTrials = trials.filter((t) => t.status === 'SCHEDULED');
  const openNegotiations = negotiations.filter((n) => n.status === 'OPEN');
  const activeContracts = contracts.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'SIGNED'
  );
  const inReviewSubmissions = submissions.filter((s) => s.status === 'IN_REVIEW');
  const upcomingTrials = scheduledTrials.filter(
    (t) => t.startsAt.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
  );
  const pendingSignature = contracts.filter((c) => c.status === 'PENDING_SIGNATURE');

  const kpis = [
    {
      href: '/dashboard/agent/players',
      icon: IconUsers,
      label: 'Jugadores representados',
      value: players.length,
    },
    {
      href: '/dashboard/agent/submissions',
      icon: IconMail,
      label: 'Submissions made',
      value: submissions.length,
    },
    {
      href: '/dashboard/agent/trials',
      icon: IconWhistle,
      label: 'Pruebas programadas',
      value: scheduledTrials.length,
    },
    {
      href: '/dashboard/agent/negotiations',
      icon: IconBriefcase,
      label: 'Negociaciones abiertas',
      value: openNegotiations.length,
    },
  ];

  const pipeline = [
    {
      href: '/dashboard/agent/players',
      label: 'Jugadores',
      sub: 'representados',
      value: players.length,
      icon: IconUsers,
    },
    {
      href: '/dashboard/agent/submissions',
      label: 'Submissions',
      sub: 'a clubes',
      value: submissions.length,
      icon: IconMail,
    },
    {
      href: '/dashboard/agent/trials',
      label: 'Pruebas',
      sub: 'programadas',
      value: scheduledTrials.length,
      icon: IconWhistle,
    },
    {
      href: '/dashboard/agent/negotiations',
      label: 'Negociaciones',
      sub: 'abiertas',
      value: openNegotiations.length,
      icon: IconBriefcase,
    },
    {
      href: '/dashboard/agent/contracts',
      label: 'Contratos',
      sub: 'activos',
      value: activeContracts.length,
      icon: IconFile,
    },
  ];

  // Pending actions
  const pendingActions: { href: string; icon: typeof IconMail; text: string; meta: string }[] = [];
  if (inReviewSubmissions.length > 0) {
    pendingActions.push({
      href: '/dashboard/agent/submissions',
      icon: IconMail,
      text: `${inReviewSubmissions.length} submission${inReviewSubmissions.length === 1 ? '' : 's'} under club review`,
      meta: 'Seguimiento',
    });
  }
  if (upcomingTrials.length > 0) {
    pendingActions.push({
      href: '/dashboard/agent/trials',
      icon: IconWhistle,
      text: `${upcomingTrials.length} trial${upcomingTrials.length === 1 ? '' : 's'} in the next 7 days`,
      meta: 'Ver agenda',
    });
  }
  if (openNegotiations.length > 0) {
    pendingActions.push({
      href: '/dashboard/agent/negotiations',
      icon: IconBriefcase,
      text: `${openNegotiations.length} open negotiation${openNegotiations.length === 1 ? '' : 's'}`,
      meta: 'Revisar ofertas',
    });
  }
  if (pendingSignature.length > 0) {
    pendingActions.push({
      href: '/dashboard/agent/contracts',
      icon: IconFile,
      text: `${pendingSignature.length} contrato${pendingSignature.length === 1 ? '' : 's'} pendiente${pendingSignature.length === 1 ? '' : 's'} de firma`,
      meta: 'Gestionar firma',
    });
  }

  // Submissions distribution by stage
  const stageCounts = ['SUBMISSION', 'TRIAL', 'NEGOTIATION', 'CONTRACT'].map((stage) => ({
    stage,
    count: submissions.filter((s) => s.stage === stage).length,
  }));

  // Recent activity
  const recentSubmissions = submissions.slice(0, 3);
  const recentTrials = trials.slice(0, 2);

  const [agentFirstName = 'Agente', agentLastName = ''] = agent.user.name.split(' ');

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <PlayerAvatar firstName={agentFirstName} lastName={agentLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{agent.agency ?? agent.user.name}</h1>
              {agent.license ? <Badge>Licencia {agent.license}</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {agent.user.email} · Representation agency
              {players.length > 0
                ? ` · ${players.length} jugador${players.length === 1 ? '' : 'es'} representado${players.length === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/agent/players/add"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Add player
            </Link>
            <Link
              href="/dashboard/agent/submissions/new"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              New submission
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: '/dashboard/agent/players', icon: IconUsers, label: 'My players' },
            { href: '/dashboard/agent/submissions', icon: IconMail, label: 'Submissions' },
            { href: '/dashboard/agent/trials', icon: IconWhistle, label: 'Pruebas' },
            { href: '/dashboard/agent/opportunities', icon: IconTarget, label: 'Oportunidades' },
          ].map((action, i) => {
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

      {/* Dynamic alert */}
      {pendingActions.length > 0 ? (
        <div className="animate-fade-up mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <IconBell className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm text-amber-100">
            You have <strong>{pendingActions.length} action{pendingActions.length === 1 ? '' : 's'} pending</strong> en tu cartera.
          </p>
          <Link
            href={pendingActions[0]!.href}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-400"
          >
            {pendingActions[0]!.meta}
          </Link>
        </div>
      ) : (
        <div className="animate-fade-up mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <IconShield className="h-4 w-4" />
          </span>
          <p className="text-sm text-emerald-100">
            All caught up. You have no pending actions in your portfolio.
          </p>
        </div>
      )}
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={80 + i * 70} />
        ))}
      </div>

      {/* Representation pipeline */}
      <Card className="animate-fade-up mb-6" style={{ animationDelay: '320ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Representation pipeline</h2>
            <Link href="/dashboard/agent/submissions" className="text-sm text-primary hover:underline">
              Manage submissions →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pipeline.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <Link
                  key={stage.label}
                  href={stage.href}
                  className="animate-fade-up group block"
                  style={{ animationDelay: `${360 + i * 60}ms` }}
                >
                  <Card className="card-hover h-full">
                    <CardContent className="flex flex-col items-center gap-1 text-center">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="text-3xl font-bold tabular-nums">
                        <CountUp value={stage.value} />
                      </div>
                      <div className="text-sm font-medium">{stage.label}</div>
                      <div className="text-xs text-muted-foreground">{stage.sub}</div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Submissions by stage + acciones pendientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '500ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Submissions by stage</h2>
            {submissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No submissions yet. When you present players to clubs, you will see their distribution here
                por fase del proceso.
              </p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {stageCounts.map((item) =>
                    item.count > 0 ? (
                      <div
                        key={item.stage}
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(item.count / submissions.length) * 100}%` }}
                      />
                    ) : null
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {stageCounts.map((item) => (
                    <span key={item.stage} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      {STAGE_LABELS[item.stage] ?? item.stage}{' '}
                      <strong className="tabular-nums">{item.count}</strong>
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '560ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Pending actions</h2>
            {pendingActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No actions require your attention.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.text}
                      href={action.href}
                      className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{action.text}</div>
                        <div className="text-xs text-muted-foreground">{action.meta}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* My players + actividad reciente */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up" style={{ animationDelay: '620ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">My players</h2>
              <Link href="/dashboard/agent/players" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {players.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Add your first player to start representing them.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {players.slice(0, 5).map(({ player }) => {
                  const positionLabel = player.position
                    ? ((POSITION_LABELS as Record<string, string | undefined>)[player.position] ??
                      player.position)
                    : 'No position';
                  return (
                    <Link
                      key={player.id}
                      href={`/dashboard/agent/players/${player.id}`}
                      className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/50"
                    >
                      <PlayerAvatar firstName={player.firstName} lastName={player.lastName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{positionLabel}</div>
                      </div>
                      <Badge variant={player.status === 'AVAILABLE' ? 'success' : 'default'}>
                        {player.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '680ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Recent activity</h2>
            {recentSubmissions.length === 0 && recentTrials.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Make a submission or manage a trial to see your portfolio activity.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconMail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {submission.player.firstName} {submission.player.lastName} →{' '}
                        {submission.club.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {STAGE_LABELS[submission.stage] ?? submission.stage} ·{' '}
                        {submission.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge variant={submission.status === 'IN_REVIEW' ? 'warning' : 'default'}>
                      {submission.status}
                    </Badge>
                  </div>
                ))}
                {recentTrials.map((trial) => (
                  <div key={trial.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconWhistle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        Prueba · {trial.player.firstName} {trial.player.lastName} en {trial.club.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {trial.startsAt.toLocaleDateString('es')} · {trial.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





