import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Pagos' };

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const payments = await prisma.payment.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/memberships"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Membresías
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Pagos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ingresos registrados: {(totalRevenue / 100).toLocaleString('es')} EUR
      </p>

      {payments.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{payment.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.description ?? payment.id} · {payment.createdAt.toLocaleDateString('es')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{(payment.amount / 100).toFixed(2)} {payment.currency}</Badge>
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
