import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { COUNTRIES } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconShield, IconUsers } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Países · Ajustes' };

export default async function AdminSettingsCountriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [players, clubs] = await Promise.all([
    prisma.player.findMany({ select: { nationality: true }, take: 500 }),
    prisma.club.findMany({ select: { country: true }, take: 500 }),
  ]);

  const playersByCountry = players.reduce<Record<string, number>>((acc, p) => {
    if (p.nationality) acc[p.nationality] = (acc[p.nationality] ?? 0) + 1;
    return acc;
  }, {});

  const clubsByCountry = clubs.reduce<Record<string, number>>((acc, c) => {
    acc[c.country] = (acc[c.country] ?? 0) + 1;
    return acc;
  }, {});

  const playersWithCountry = players.filter((p) => p.nationality).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Países"
        subtitle="Mercados configurados y presencia de la plataforma"
        icon="shield"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard href="/dashboard/admin/settings" icon={IconShield} label="Países configurados" value={COUNTRIES.length} />
        <StatCard href="/dashboard/admin/players" icon={IconUsers} label="Jugadores con país" value={playersWithCountry} />
        <StatCard href="/dashboard/admin/clubs" icon={IconUsers} label="Clubes con país" value={clubs.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Jugadores por país</h2>
            {Object.keys(playersByCountry).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin nacionalidades registradas.</p>
            ) : (
              <CountsBars
                items={Object.entries(playersByCountry)
                  .map(([label, value]) => ({ label, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 10)}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Clubes por país</h2>
            {Object.keys(clubsByCountry).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin clubes registrados.</p>
            ) : (
              <CountsBars
                items={Object.entries(clubsByCountry)
                  .map(([label, value]) => ({ label, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 10)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="mb-3 font-semibold">Catálogo de países</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <Badge key={country} variant="outline">
                {country}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
