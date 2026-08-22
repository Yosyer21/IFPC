import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { CountsBars } from '@/components/player/charts';
import { IconStar, IconTarget, IconTrendingUp, IconUsers } from '@/components/dashboard/icons';
import { formatCurrency, monthlyCounts } from '@/components/admin/analytics-utils';

export const metadata: Metadata = { title: 'Analytics · Ingresos' };

const TIER_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  PREMIUM: 'Premium',
  SCOUT: 'Scout',
  CLUB: 'Club',
};

export default async function AdminAnalyticsRevenuePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [payments, memberships] = await Promise.all([
    prisma.payment.findMany({
      select: { amount: true, currency: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.membership.findMany({ select: { tier: true } }),
  ]);

  const paid = payments.filter((p) => p.status === 'PAID');
  const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;

  const byTier = Object.keys(TIER_LABELS).map((tier) => ({
    label: TIER_LABELS[tier] ?? tier,
    value: memberships.filter((m) => m.tier === tier).length,
  }));

  const monthly = monthlyCounts(paid, 6);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analytics de ingresos"
        subtitle="Pagos simulados, membresías y evolución mensual"
        icon="trending"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/dashboard/admin/memberships/payments"
          icon={IconStar}
          label="Ingresos (EUR)"
          value={Math.round(totalRevenue / 100)}
          suffix=" €"
        />
        <StatCard href="/dashboard/admin/memberships/payments" icon={IconUsers} label="Pagos realizados" value={paid.length} />
        <StatCard href="/dashboard/admin/memberships" icon={IconTarget} label="Membresías" value={memberships.length} />
        <StatCard href="/dashboard/admin/memberships/payments" icon={IconTrendingUp} label="Pagos pendientes" value={pendingPayments} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Membresías por plan</h2>
            <CountsBars items={byTier} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Pagos cobrados por mes</h2>
            <CountsBars items={monthly} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="mb-3 font-semibold">Últimos pagos ({payments.length})</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {payments.slice(0, 30).map((payment) => (
                <div
                  key={`${payment.createdAt.getTime()}-${payment.amount}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {payment.createdAt.toLocaleDateString('es')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={payment.status === 'PAID' ? 'success' : 'warning'}>
                      {formatCurrency(payment.amount, payment.currency.toUpperCase())}
                    </Badge>
                    <Badge variant="outline">{payment.status}</Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
