import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { StatCard } from '@/components/player/stat-card';
import { PlayerAvatar } from '@/components/player/avatar';
import {
  IconBell,
  IconBriefcase,
  IconMail,
  IconShield,
  IconStar,
  IconTarget,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Centro de control' };

const ROLE_LABELS: Record<string, string> = {
  PLAYER: 'Jugadores',
  PARENT: 'Familiares',
  COACH: 'Entrenadores',
  SCOUT: 'Ojeadores',
  AGENT: 'Agentes',
  CLUB: 'Clubes',
  UNIVERSITY: 'Universidades',
  ADMIN: 'Admins',
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [
    users,
    players,
    clubs,
    openOpportunities,
    payments,
    newInquiries,
    pendingPlayers,
    unverifiedClubs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.club.count(),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
    prisma.payment.findMany({ where: { status: 'PAID' }, orderBy: { createdAt: 'desc' } }),
    prisma.inquiry.count({ where: { status: 'NEW' } }),
    prisma.player.count({ where: { status: 'PENDING_VERIFICATION' } }),
    prisma.club.count({ where: { verified: false } }),
  ]);

  // Usuarios por rol
  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const roleCounts = new Map(usersByRole.map((row) => [row.role, row._count._all]));
  const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const kpis = [
    { href: '/dashboard/admin/users', icon: IconUsers, label: 'Usuarios', value: users },
    { href: '/dashboard/admin/players', icon: IconWhistle, label: 'Jugadores', value: players },
    { href: '/dashboard/admin/clubs', icon: IconBriefcase, label: 'Clubes', value: clubs },
    { href: '/dashboard/admin/opportunities', icon: IconTarget, label: 'Oportunidades abiertas', value: openOpportunities },
    { href: '/dashboard/admin/memberships/payments', icon: IconStar, label: 'Pagos', value: payments.length },
    { href: '/dashboard/admin/analytics/revenue', icon: IconStar, label: 'Ingresos', value: Math.round(revenue / 100) },
  ];

  // Acciones pendientes
  const pendingActions: { href: string; icon: typeof IconBell; text: string; meta: string }[] = [];
  if (pendingPlayers > 0) {
    pendingActions.push({
      href: '/dashboard/admin/players/pending',
      icon: IconWhistle,
      text: `${pendingPlayers} jugador${pendingPlayers === 1 ? '' : 'es'} pendiente${pendingPlayers === 1 ? '' : 's'} de verificación`,
      meta: 'Revisar',
    });
  }
  if (unverifiedClubs > 0) {
    pendingActions.push({
      href: '/dashboard/admin/clubs/pending',
      icon: IconBriefcase,
      text: `${unverifiedClubs} club${unverifiedClubs === 1 ? '' : 'es'} sin verificar`,
      meta: 'Verificar',
    });
  }
  if (newInquiries > 0) {
    pendingActions.push({
      href: '/dashboard/admin/communications/inquiries',
      icon: IconMail,
      text: `${newInquiries} consulta${newInquiries === 1 ? '' : 's'} nueva${newInquiries === 1 ? '' : 's'} sin responder`,
      meta: 'Responder',
    });
  }

  // Usuarios por rol (barras)
  const maxRoleCount = Math.max(1, ...Array.from(roleCounts.values()));
  const roleBars = Object.entries(ROLE_LABELS)
    .map(([role, label]) => ({ role, label, count: roleCounts.get(role as never) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Actividad reciente
  const [recentUsers, recentPayments] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.payment.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const [adminFirstName = 'Admin', adminLastName = ''] = session.user.name?.split(' ') ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <PlayerAvatar firstName={adminFirstName} lastName={adminLastName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {adminFirstName} {adminLastName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Administración
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Centro de control de la plataforma · {users} usuarios · {players} jugadores ·{' '}
              {clubs} clubes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/admin/users"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Usuarios
            </Link>
            <Link
              href="/dashboard/admin/memberships/payments"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Pagos
            </Link>
          </div>
        </div>
      </section>

      {/* Alerta dinámica */}
      {pendingActions.length > 0 ? (
        <div className="animate-fade-up mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <IconBell className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm text-amber-100">
            Tienes <strong>{pendingActions.length} acción{pendingActions.length === 1 ? '' : 'es'} pendiente{pendingActions.length === 1 ? '' : 's'}</strong> de moderación en la plataforma.
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
            Todo al día. No hay acciones de moderación pendientes.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            {...kpi}
            suffix={kpi.label === 'Ingresos' ? ' €' : undefined}
            delay={80 + i * 60}
          />
        ))}
      </div>
      {/* Usuarios por rol + acciones pendientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '400ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Usuarios por rol</h2>
              <Link href="/dashboard/admin/users" className="text-sm text-primary hover:underline">
                Gestionar usuarios →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {roleBars.map((item) => (
                <div key={item.role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="fb-bar h-full rounded-full bg-gradient-to-r from-emerald-700 to-primary"
                      style={{
                        '--bar-target': `${Math.max(4, (item.count / maxRoleCount) * 100)}%`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '460ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Acciones pendientes</h2>
            {pendingActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay acciones de moderación pendientes.
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
      {/* Actividad reciente + ingresos recientes */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '520ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Actividad reciente</h2>
            {recentUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad todavía.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconUsers className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{user.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {user.email} · {user.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge>{user.role}</Badge>
                  </div>
                ))}
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconStar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {payment.description ?? 'Pago'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {payment.user?.name ?? 'Usuario'} · {payment.createdAt.toLocaleDateString('es')}
                      </div>
                    </div>
                    <Badge variant="success">
                      {(payment.amount / 100).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: payment.currency.toUpperCase(),
                      })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '580ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Ingresos recientes</h2>
              <Link href="/dashboard/admin/analytics/revenue" className="text-sm text-primary hover:underline">
                Analítica →
              </Link>
            </div>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {(revenue / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
              <span className="text-sm text-muted-foreground">ingresos totales</span>
            </div>
            {recentPayments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aún no hay pagos registrados.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentPayments.slice(0, 3).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {payment.user?.name ?? 'Usuario'}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {(payment.amount / 100).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: payment.currency.toUpperCase(),
                      })}
                    </span>
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




