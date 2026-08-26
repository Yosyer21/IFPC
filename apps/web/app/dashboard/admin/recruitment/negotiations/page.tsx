import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Negociaciones · Reclutamiento' };

export default async function AdminRecruitmentNegotiationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const negotiations = await prisma.negotiation.findMany({
    include: { player: true, club: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const open = negotiations.filter((n) => n.status === 'OPEN' || n.status === 'ONGOING').length;
  const totalOffers = negotiations.reduce((sum, n) => sum + (n.offerAmount ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/recruitment"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Recruitment
      </Link>
      <PageHeader
        title="Negociaciones"
        subtitle={`${negotiations.length} negociaciones registradas`}
        icon="briefcase"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline">{open} abiertas</Badge>
        <Badge variant="outline">Ofertas: {(totalOffers / 100).toLocaleString('es')} EUR</Badge>
      </div>

      {negotiations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay negociaciones registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {negotiations.map((negotiation) => (
            <Card key={negotiation.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {negotiation.player.firstName} {negotiation.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">→ {negotiation.club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {negotiation.createdAt.toLocaleDateString('es')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {negotiation.offerAmount ? (
                    <Badge variant="success">
                      {(negotiation.offerAmount / 100).toLocaleString('es')} {negotiation.currency}
                    </Badge>
                  ) : null}
                  <StatusBadge status={negotiation.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
