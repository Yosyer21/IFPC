import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function AgentOpportunitiesPage() {
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
        title="Oportunidades abiertas"
        subtitle="Convocatorias publicadas por clubes en la plataforma"
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
            <Link
              key={opportunity.id}
              href={
                opportunity.clubId
                  ? `/dashboard/agent/clubs/${opportunity.clubId}`
                  : '/dashboard/agent/clubs'
              }
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
                  <p className="text-xs text-muted-foreground">
                    {opportunity.position ? `Position: ${opportunity.position}` : ''}
                    {opportunity.closesAt
                      ? ` · Cierra: ${opportunity.closesAt.toLocaleDateString('es')}`
                      : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
