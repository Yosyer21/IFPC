import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { LEAGUES } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconBriefcase, IconShield } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Ligas · Ajustes' };

export default async function AdminSettingsLeaguesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const clubs = await prisma.club.findMany({
    select: { id: true, league: true, name: true, country: true },
    orderBy: { name: 'asc' },
    take: 500,
  });

  const clubsByLeague = LEAGUES.map((league) => ({
    label: league,
    value: clubs.filter((c) => c.league === league).length,
  })).filter((item) => item.value > 0);

  const otherClubs = clubs.filter((c) => !c.league || !LEAGUES.includes(c.league as never));
  const withLeague = clubs.filter((c) => c.league && LEAGUES.includes(c.league as never)).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Ligas"
        subtitle="Competiciones de los clubes registrados"
        icon="briefcase"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard href="/dashboard/admin/clubs" icon={IconBriefcase} label="Clubes con liga" value={withLeague} />
        <StatCard href="/dashboard/admin/clubs" icon={IconBriefcase} label="Clubes sin liga" value={otherClubs.length} />
        <StatCard href="/dashboard/admin/settings" icon={IconShield} label="Ligas configuradas" value={LEAGUES.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Clubes por liga</h2>
            {clubsByLeague.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin clubes con liga asignada.</p>
            ) : (
              <CountsBars items={clubsByLeague} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Clubes sin liga configurada</h2>
            {otherClubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos los clubes tienen liga asignada.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {otherClubs.slice(0, 20).map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <span className="font-medium">{club.name}</span>
                    <Badge variant="outline">{club.country}</Badge>
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
