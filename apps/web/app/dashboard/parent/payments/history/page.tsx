import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { IconCalendar, IconStar, IconUsers } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Historial de pagos' };

export default async function ParentPaymentsHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const paid = payments.filter((p) => p.status === 'PAID');
  const total = paid.reduce((sum, p) => sum + p.amount, 0);
  const totalFormatted = `${(total / 100).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
  })}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Historial de pagos"
        subtitle="Todos los movimientos de tu cuenta familiar"
        icon="star"
      >
        <Link href="/dashboard/parent/payments" className="text-sm text-muted-foreground hover:underline">
          ← Pagos
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard href="/dashboard/parent/payments/history" icon={IconStar} label="Total pagado" value={Math.round(total / 100)} />
        <StatCard href="/dashboard/parent/payments/history" icon={IconUsers} label="Pagos" value={payments.length} />
        <StatCard href="/dashboard/parent/payments/history" icon={IconCalendar} label="Pagados" value={paid.length} />
      </div>

      <Card>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay movimientos registrados todavía. ({totalFormatted})
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {payment.description ?? 'Pago'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {payment.createdAt.toLocaleDateString('es')} ·{' '}
                      {payment.createdAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {(payment.amount / 100).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: payment.currency.toUpperCase(),
                      })}
                    </span>
                    <Badge variant={payment.status === 'PAID' ? 'success' : 'warning'}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


