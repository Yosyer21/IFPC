import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@future-buller/config';
import { closeOpportunityAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function AdminOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const opportunities = await prisma.opportunity.findMany({
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Oportunidades"
        subtitle="Convocatorias publicadas por los clubes"
        icon="target"
      />

      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay oportunidades registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{opportunity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {opportunity.club?.name ?? opportunity.university?.name ?? '—'} ·{' '}
                    {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                      opportunity.type
                    ] ?? opportunity.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={opportunity.status === 'OPEN' ? 'success' : 'default'}>
                    {opportunity.status}
                  </Badge>
                  {opportunity.status === 'OPEN' ? (
                    <form action={closeOpportunityAction}>
                      <input type="hidden" name="opportunityId" value={opportunity.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Cerrar
                      </button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
