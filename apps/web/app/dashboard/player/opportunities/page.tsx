import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function PlayerOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Oportunidades" icon="target">
        <Link
          href="/dashboard/player/opportunities/applications"
          className="text-sm text-muted-foreground hover:underline"
        >
          Mis solicitudes →
        </Link>
      </PageHeader>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay oportunidades abiertas en este momento. Vuelve pronto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/dashboard/player/opportunities/${opportunity.id}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary">
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
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {opportunity.position ? <span>Posición: {opportunity.position}</span> : null}
                    {opportunity.location ? <span>{opportunity.location}</span> : null}
                    {opportunity.closesAt ? (
                      <span>Cierra: {opportunity.closesAt.toLocaleDateString('es')}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
