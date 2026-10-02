import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { SCHOOL_TYPE_LABELS } from '@/lib/labels';
import { StatCard } from '@/components/player/stat-card';
import { PageHeader } from '@/components/player/page-header';
import { IconCalendar, IconTarget, IconUsers, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Escuela / Comunidad' };

export default async function SchoolDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const school = await prisma.school.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!school) return null;

  const [availablePlayers, openOpportunities, openCamps, upcomingCamps] = await Promise.all([
    prisma.player.count({ where: { status: 'AVAILABLE' } }),
    prisma.opportunity.count({ where: { status: 'OPEN' } }),
    prisma.camp.count({ where: { status: 'OPEN' } }),
    prisma.camp.findMany({
      where: { status: { in: ['OPEN', 'FULL'] }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 5,
    }),
  ]);

  const kpis = [
    {
      href: '/dashboard/school/participants',
      icon: IconUsers,
      label: 'Jugadoras disponibles',
      value: availablePlayers,
    },
    {
      href: '/dashboard/school/opportunities',
      icon: IconTarget,
      label: 'Oportunidades abiertas',
      value: openOpportunities,
    },
    { href: '/dashboard/school', icon: IconCalendar, label: 'Clínicas abiertas', value: openCamps },
    {
      href: '/dashboard/school',
      icon: IconWhistle,
      label: 'Próximas clínicas',
      value: upcomingCamps.length,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={school.name}
        subtitle="Programa escolar y comunitario — grupos, clínicas y oportunidades"
        icon="book"
      >
        <Badge variant={school.verified ? 'success' : 'outline'}>
          {school.verified ? 'Verificada' : 'Pendiente de verificación'}
        </Badge>
        <Badge>{SCHOOL_TYPE_LABELS[school.type] ?? school.type}</Badge>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <StatCard key={kpi.label} {...kpi} delay={index * 60} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up">
          <CardContent>
            <h2 className="mb-3 font-semibold">Ficha de la organización</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-medium">{SCHOOL_TYPE_LABELS[school.type] ?? school.type}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Country</dt>
                <dd className="font-medium">{school.country}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ciudad</dt>
                <dd className="font-medium">{school.city ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Contacto</dt>
                <dd className="font-medium">{school.contactName ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{school.user?.email ?? '—'}</dd>
              </div>
            </dl>
            <Link
              href="/dashboard/school/profile"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Ver perfil de organización →
            </Link>
          </CardContent>
        </Card>

        <Card className="animate-fade-up lg:col-span-2" style={{ animationDelay: '120ms' }}>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Próximas clínicas y camps</h2>
              <Link
                href="/dashboard/school/opportunities"
                className="text-sm text-primary hover:underline"
              >
                Ver oportunidades →
              </Link>
            </div>
            {upcomingCamps.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay clínicas programadas por el momento.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingCamps.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconCalendar className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{camp.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {camp.startsAt.toLocaleDateString('es')}
                        {camp.city ? ` · ${camp.city}` : ''}
                        {camp.country ? `, ${camp.country}` : ''}
                      </div>
                    </div>
                    <Badge variant={camp.status === 'OPEN' ? 'success' : 'warning'}>
                      {camp.status === 'OPEN' ? 'Inscripciones abiertas' : 'Completo'}
                    </Badge>
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
