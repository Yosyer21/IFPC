import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconStar } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Pagos' };

export default async function ParentPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Pagos"
        subtitle="Historial de pagos de tu cuenta familiar"
        icon="star"
      />

      {payments.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconStar className="h-7 w-7" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay pagos registrados en tu cuenta todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment, i) => (
            <Card
              key={payment.id}
              className="card-hover animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{payment.description ?? 'Pago'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {payment.createdAt.toLocaleDateString('es')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">
                    {(payment.amount / 100).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: payment.currency.toUpperCase(),
                    })}
                  </div>
                  <Badge variant={payment.status === 'PAID' ? 'success' : 'warning'}>
                    {payment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
