import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import {
  IconBriefcase,
  IconTarget,
  IconTrendingUp,
  IconUser,
  IconUsers,
  IconWhistle,
} from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Analíticas' };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [
    users,
    players,
    availablePlayers,
    clubs,
    verifiedClubs,
    opportunities,
    applications,
    submissions,
    payments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.player.count({ where: { status: 'AVAILABLE' } }),
    prisma.club.count(),
    prisma.club.count({ where: { verified: true } }),
    prisma.opportunity.count(),
    prisma.application.count(),
    prisma.submission.count(),
    prisma.payment.count(),
  ]);

  const sections = [
    {
      href: '/dashboard/admin/analytics/players',
      title: 'Jugadores',
      description: 'Distribución por estado, posición y registros por mes',
    },
    {
      href: '/dashboard/admin/analytics/clubs',
      title: 'Clubes',
      description: 'Verificación, países y evolución de registros',
    },
    {
      href: '/dashboard/admin/analytics/recruitment',
      title: 'Reclutamiento',
      description: 'Embudo del pipeline y conversión entre etapas',
    },
    {
      href: '/dashboard/admin/analytics/revenue',
      title: 'Ingresos',
      description: 'Pagos, membresías por plan y evolución mensual',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analíticas"
        subtitle="Métricas operativas de la plataforma"
        icon="trending"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard href="/dashboard/admin/users" icon={IconUsers} label="Usuarios" value={users} />
        <StatCard href="/dashboard/admin/players" icon={IconUser} label="Jugadores" value={players} />
        <StatCard href="/dashboard/admin/players" icon={IconWhistle} label="Disponibles" value={availablePlayers} />
        <StatCard href="/dashboard/admin/clubs" icon={IconBriefcase} label="Clubes" value={clubs} />
        <StatCard href="/dashboard/admin/clubs" icon={IconBriefcase} label="Clubes verificados" value={verifiedClubs} />
        <StatCard href="/dashboard/admin/opportunities" icon={IconTarget} label="Oportunidades" value={opportunities} />
        <StatCard href="/dashboard/admin/players" icon={IconTarget} label="Solicitudes" value={applications} />
        <StatCard href="/dashboard/admin/recruitment" icon={IconBriefcase} label="Envíos" value={submissions} />
        <StatCard href="/dashboard/admin/memberships/payments" icon={IconTrendingUp} label="Pagos" value={payments} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group block">
            <Card className="card-hover h-full">
              <CardContent>
                <h2 className="font-semibold">{section.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                <span className="mt-3 inline-block text-sm text-primary group-hover:underline">
                  Ver analytics →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
