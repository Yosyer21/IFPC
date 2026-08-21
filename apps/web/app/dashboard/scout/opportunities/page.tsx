import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@future-buller/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function ScoutOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Oportunidades"
        subtitle="Convocatorias abiertas de clubes donde orientar a tus candidatos"
        icon="target"
      />

      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay oportunidades abiertas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent className="flex flex-col gap-2">
                <Badge>
                  {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                    opportunity.type
                  ] ?? opportunity.type}
                </Badge>
                <h2 className="font-semibold">{opportunity.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {opportunity.position ? `Posición: ${opportunity.position}` : ''}
                  {opportunity.location ? ` · ${opportunity.location}` : ''}
                </p>
                <Link
                  href="/dashboard/scout/players"
                  className="text-sm text-primary hover:underline"
                >
                  Buscar candidatos →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
