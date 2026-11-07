import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { StatusBadge } from '@/components/admin/status-badge';
import { CreateOpportunityForm } from '@/components/club/create-opportunity-form';
import { PageHeader } from '@/components/player/page-header';

/** Color de la etiqueta por tipo de oportunidad (paleta suave de referencia). */
const OPPORTUNITY_TONE: Record<string, string> = {
  TRIAL: 'fb-tag-violet',
  SCOUTING: 'fb-tag-blue',
  CONTRACT: 'fb-tag-amber',
  SCHOLARSHIP: 'fb-tag-lime',
  ACADEMY: 'fb-tag-gray',
};

export const metadata: Metadata = { title: 'Club opportunities' };

export default async function ClubOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const opportunities = await prisma.opportunity.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Opportunities"
        subtitle="Publish call-ups for players to apply"
        icon="target"
      />

      <CreateOpportunityForm />

      <div className="mb-3 mt-8 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight">Published</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {opportunities.length}
        </span>
      </div>
      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't posted opportunities yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => {
            const typeLabel =
              (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                opportunity.type
              ] ?? opportunity.type;
            return (
              <Card key={opportunity.id} className="card-hover">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`fb-tag ${OPPORTUNITY_TONE[opportunity.type] ?? 'fb-tag-gray'}`}
                    >
                      {typeLabel}
                    </span>
                    <StatusBadge status={opportunity.status} />
                  </div>
                  <h3 className="text-base font-bold leading-snug">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {opportunity.position ? `Position: ${opportunity.position}` : 'Open position'}
                    {opportunity.location ? ` · ${opportunity.location}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created on {opportunity.createdAt.toLocaleDateString('en-GB')}
                  </p>
                  <Link
                    href="/dashboard/club/players"
                    className="mt-1 text-sm font-semibold text-foreground hover:underline"
                  >
                    View candidates →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
