import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { COUNTRIES } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconShield, IconUsers } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Countries · Settings' };

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
        title="Countries"
        subtitle="Mercados configurados y presencia de la plataforma"
        icon="shield"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard href="/dashboard/admin/settings" icon={IconShield} label="Configured countries" value={COUNTRIES.length} />
        <StatCard href="/dashboard/admin/players" icon={IconUsers} label="Players by country" value={playersWithCountry} />
        <StatCard href="/dashboard/admin/clubs" icon={IconUsers} label="Clubs by country" value={clubs.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Players by country</h2>
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
            <h2 className="mb-4 font-semibold">Clubs by country</h2>
            {Object.keys(clubsByCountry).length === 0 ? (
              <p className="text-sm text-muted-foreground">No registered clubs.</p>
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
          <h2 className="mb-3 font-semibold">Countries catalog</h2>
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
