import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Membresías' };

export default async function AdminMembershipsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [memberships, payments] = await Promise.all([
    prisma.membership.findMany({ include: { user: true }, take: 50 }),
    prisma.payment.count(),
  ]);

  const byTier = memberships.reduce<Record<string, number>>((acc, membership) => {
    acc[membership.tier] = (acc[membership.tier] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Membresías"
        subtitle="Planes activos y distribución por tier"
        icon="star"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>Total: {memberships.length}</Badge>
        {Object.entries(byTier).map(([tier, count]) => (
          <Badge key={tier} variant="outline">
            {tier}: {count}
          </Badge>
        ))}
        <Link href="/dashboard/admin/memberships/payments" className="text-sm text-primary hover:underline">
          Pagos ({payments}) →
        </Link>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay membresías activas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {memberships.map((membership) => (
            <Card key={membership.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{membership.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {membership.user.email} · Hasta{' '}
                    {membership.endsAt ? membership.endsAt.toLocaleDateString('es') : '—'}
                  </p>
                </div>
                <Badge variant={membership.tier !== 'FREE' ? 'success' : 'default'}>
                  {membership.tier}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
