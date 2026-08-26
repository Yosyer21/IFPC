import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { CreateOpportunityForm } from '@/components/club/create-opportunity-form';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Oportunidades del club' };

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
        title="Oportunidades"
        subtitle="Publica convocatorias para que los jugadores apliquen"
        icon="target"
      />

      <CreateOpportunityForm />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Publicadas</h2>
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
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge>
                    {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                      opportunity.type
                    ] ?? opportunity.type}
                  </Badge>
                  <Badge
                    variant={opportunity.status === 'OPEN' ? 'success' : 'default'}
                  >
                    {opportunity.status}
                  </Badge>
                </div>
                <h2 className="font-semibold">{opportunity.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {opportunity.position ? `Position: ${opportunity.position}` : 'Open position'}
                  {opportunity.location ? ` · ${opportunity.location}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Creada el {opportunity.createdAt.toLocaleDateString('es')}
                </p>
                <Link
                  href={`/dashboard/club/players`}
                  className="text-sm text-primary hover:underline"
                >
                  Ver candidatos →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
