import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { COUNTRIES } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconBriefcase, IconShield, IconUsers } from '@/components/dashboard/icons';
import { monthlyCounts } from '@/components/admin/analytics-utils';

export const metadata: Metadata = { title: 'Analytics · Clubes' };

export default async function AdminAnalyticsClubsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubs = await prisma.club.findMany({
    select: { verified: true, country: true, createdAt: true, _count: { select: { opportunities: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const total = clubs.length;
  const verified = clubs.filter((c) => c.verified).length;
  const pending = total - verified;
  const withOpportunities = clubs.filter((c) => c._count.opportunities > 0).length;

  const byCountry = COUNTRIES.map((country) => ({
    label: country,
    value: clubs.filter((c) => c.country === country).length,
  })).filter((item) => item.value > 0);

  const monthly = monthlyCounts(clubs, 6);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics de clubes"
        subtitle="Verification, geographic distribution and growth"
        icon="trending"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/dashboard/admin/clubs" icon={IconUsers} label="Clubes totales" value={total} />
        <StatCard href="/dashboard/admin/clubs" icon={IconShield} label="Verificados" value={verified} />
        <StatCard href="/dashboard/admin/clubs/pending" icon={IconBriefcase} label="Pendientes" value={pending} />
        <StatCard href="/dashboard/admin/opportunities" icon={IconBriefcase} label="Con oportunidades" value={withOpportunities} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">By country</h2>
            {byCountry.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registered clubs.</p>
            ) : (
              <CountsBars items={byCountry} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Monthly registrations</h2>
            <CountsBars items={monthly} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
