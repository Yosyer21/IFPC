import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { closeOpportunityAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

/** Color de la etiqueta por tipo de oportunidad (paleta suave de referencia). */
const OPPORTUNITY_TONE: Record<string, string> = {
  TRIAL: 'fb-tag-violet',
  SCOUTING: 'fb-tag-blue',
  CONTRACT: 'fb-tag-amber',
  SCHOLARSHIP: 'fb-tag-lime',
  ACADEMY: 'fb-tag-gray',
};

export const metadata: Metadata = { title: 'Opportunities' };

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
        title="Opportunities"
        subtitle="Call-ups published by clubs"
        icon="target"
      />

      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No opportunities recorded.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {opportunities.map((opportunity) => {
            const typeLabel =
              (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[opportunity.type] ??
              opportunity.type;
            return (
              <Card key={opportunity.id} className="card-hover">
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`fb-tag ${OPPORTUNITY_TONE[opportunity.type] ?? 'fb-tag-gray'}`}
                      >
                        {typeLabel}
                      </span>
                      <StatusBadge status={opportunity.status} />
                    </div>
                    <p className="mt-1 font-semibold">{opportunity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                    </p>
                  </div>
                  {opportunity.status === 'OPEN' ? (
                    <form action={closeOpportunityAction}>
                      <input type="hidden" name="opportunityId" value={opportunity.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        Close
                      </button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
