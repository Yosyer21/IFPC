import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { StatCard } from '@/components/player/stat-card';
import { CountUp } from '@/components/player/count-up';
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

export const metadata: Metadata = { title: 'Centro de reclutamiento' };

export default async function ClubDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!club) notFound();

  const [opportunities, requirements, inquiries, applications] = await Promise.all([
    prisma.opportunity.findMany({ where: { clubId: club.id }, orderBy: { createdAt: 'desc' } }),
    prisma.requirement.findMany({ where: { clubId: club.id }, orderBy: { createdAt: 'desc' } }),
    prisma.inquiry.findMany({ where: { clubId: club.id }, orderBy: { createdAt: 'desc' } }),
    prisma.application.findMany({
      where: { opportunity: { clubId: club.id } },
      include: { player: true, opportunity: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Derivados
  const openOpportunities = opportunities.filter((o) => o.status === 'OPEN');
  const draftOpportunities = opportunities.filter((o) => o.status === 'DRAFT');
  const expiring = openOpportunities.filter(
    (o) => o.closesAt && o.closesAt.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
  );
  const newInquiries = inquiries.filter((i) => i.status === 'NEW');
  const openRequirements = requirements.filter((r) => r.status === 'OPEN');
  const pendingApplications = applications.filter((a) => a.status === 'PENDING');
  const acceptedApplications = applications.filter((a) => a.status === 'ACCEPTED');
  const rejectedApplications = applications.filter((a) => a.status === 'REJECTED');

  // KPIs
  const kpis = [
    {
      href: '/dashboard/club/opportunities',
      icon: IconTarget,
      label: 'Oportunidades abiertas',
      value: openOpportunities.length,
    },
    {
      href: '/dashboard/club/applications',
      icon: IconUsers,
      label: 'Solicitudes pendientes',
      value: pendingApplications.length,
    },
    {
      href: '/dashboard/club/requirements',
      icon: IconFile,
      label: 'Requisitos activos',
      value: openRequirements.length,
    },
    {
      href: '/dashboard/club/inquiries',
      icon: IconMail,
      label: 'Consultas sin responder',
      value: newInquiries.length,
    },
  ];

  // Pipeline de reclutamiento
  const pipeline = [
    {
      href: '/dashboard/club/opportunities',
      label: 'Oportunidades',
      sub: 'activas publicadas',
      value: openOpportunities.length,
      icon: IconTarget,
    },
    {
      href: '/dashboard/club/applications',
      label: 'Solicitudes',
      sub: 'recibidas en total',
      value: applications.length,
      icon: IconUsers,
    },
    {
      href: '/dashboard/club/applications',
      label: 'Pendientes',
      sub: 'por revisar',
      value: pendingApplications.length,
      icon: IconWhistle,
    },
    {
      href: '/dashboard/club/applications',
      label: 'Aceptadas',
      sub: 'en proceso',
      value: acceptedApplications.length,
      icon: IconShield,
    },
  ];

  // Acciones pendientes (priorizadas)
  const pendingActions: { href: string; icon: typeof IconMail; text: string; meta: string }[] = [];
  if (pendingApplications.length > 0) {
    pendingActions.push({
      href: '/dashboard/club/applications',
      icon: IconUsers,
      text: `${pendingApplications.length} solicitud${pendingApplications.length === 1 ? '' : 'es'} pendiente${pendingApplications.length === 1 ? '' : 's'} de revisión`,
      meta: 'Revisar candidatos',
    });
  }
  if (newInquiries.length > 0) {
    pendingActions.push({
      href: '/dashboard/club/inquiries',
      icon: IconMail,
      text: `${newInquiries.length} consulta${newInquiries.length === 1 ? '' : 's'} sin responder`,
      meta: 'Responder ahora',
    });
  }
  if (draftOpportunities.length > 0) {
    pendingActions.push({
      href: '/dashboard/club/opportunities',
      icon: IconFile,
      text: `${draftOpportunities.length} oportunidad${draftOpportunities.length === 1 ? '' : 'es'} en borrador sin publicar`,
      meta: 'Publicar',
    });
  }
  if (expiring.length > 0) {
    pendingActions.push({
      href: '/dashboard/club/opportunities',
      icon: IconBell,
      text: `${expiring.length} oportunidad${expiring.length === 1 ? '' : 'es'} cierran en menos de 7 días`,
      meta: 'Ver plazos',
    });
  }

  // Actividad reciente
  const recentApps = applications.slice(0, 3);
  const recentInquiries = inquiries.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero compacto */}
      <section className="animate-fade-up mb-6 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconShield className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
              <Badge variant={club.verified ? 'success' : 'warning'}>
                {club.verified ? 'Verificado' : 'Pendiente de verificación'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {club.city ? `${club.city}, ` : ''}
              {club.country}
              {club.league ? ` · ${club.league}` : ''} · Centro de reclutamiento
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/club/opportunities"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Publicar oportunidad
            </Link>
            <Link
              href="/dashboard/club/requirements/new"
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              Nuevo requisito
            </Link>
            <Link
              href="/dashboard/club/applications"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
            >
              Ver solicitudes
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
            Tienes <strong>{pendingActions.length} acción{pendingActions.length === 1 ? '' : 'es'} pendiente{pendingActions.length === 1 ? '' : 's'}</strong> en el centro de reclutamiento.
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
            Todo al día. No tienes acciones pendientes en el centro de reclutamiento.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={80 + i * 70} />
        ))}
      </div>

      {/* Pipeline */}
      <Card className="animate-fade-up mb-6" style={{ animationDelay: '320ms' }}>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Pipeline de reclutamiento</h2>
            <Link href="/dashboard/club/applications" className="text-sm text-primary hover:underline">
              Gestionar solicitudes →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      {/* Solicitudes por estado + requisitos activos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '500ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Solicitudes por estado</h2>
            {applications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay solicitudes. Cuando los jugadores apliquen a tus oportunidades, verás aquí
                la distribución.
              </p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {pendingApplications.length > 0 ? (
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${(pendingApplications.length / applications.length) * 100}%` }}
                    />
                  ) : null}
                  {acceptedApplications.length > 0 ? (
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(acceptedApplications.length / applications.length) * 100}%` }}
                    />
                  ) : null}
                  {rejectedApplications.length > 0 ? (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(rejectedApplications.length / applications.length) * 100}%` }}
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Pendientes <strong className="tabular-nums">{pendingApplications.length}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Aceptadas <strong className="tabular-nums">{acceptedApplications.length}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Rechazadas <strong className="tabular-nums">{rejectedApplications.length}</strong>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '560ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Requisitos activos</h2>
              <Link href="/dashboard/club/requirements/new" className="text-sm text-primary hover:underline">
                Crear →
              </Link>
            </div>
            {openRequirements.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Define qué perfiles buscas para activar el matching.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {openRequirements.map((requirement) => (
                  <Link
                    key={requirement.id}
                    href={`/dashboard/club/requirements/${requirement.id}`}
                    className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/50"
                  >
                    <IconBriefcase className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{requirement.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {requirement.position ?? 'Cualquier posición'}
                        {requirement.ageMin || requirement.ageMax
                          ? ` · ${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'} años`
                          : ''}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Ver →</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Acciones pendientes + actividad reciente */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '620ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Actividad reciente</h2>
            {recentApps.length === 0 && recentInquiries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Publica oportunidades y responde consultas para ver la actividad de tu club.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/60">
                {recentApps.map((application) => (
                  <div key={application.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconUsers className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {application.player.firstName} {application.player.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Solicitó «{application.opportunity.title}»
                      </div>
                    </div>
                    <Badge
                      variant={
                        application.status === 'ACCEPTED'
                          ? 'success'
                          : application.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {application.status}
                    </Badge>
                  </div>
                ))}
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconMail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{inquiry.subject ?? 'Consulta'}</div>
                      <div className="truncate text-xs text-muted-foreground">{inquiry.name}</div>
                    </div>
                    <Badge variant={inquiry.status === 'NEW' ? 'warning' : 'success'}>
                      {inquiry.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '680ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Acciones pendientes</h2>
            {pendingActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay acciones que requieran tu atención.
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
    </div>
  );
}



