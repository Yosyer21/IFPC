import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Opportunities' };

export default async function SchoolOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const school = await prisma.school.findUnique({ where: { userId: session.user.id } });
  if (!school) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Opportunities"
        subtitle="Clinics, trials and open scholarships on the platform"
        icon="target"
      />

      {opportunities.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">There are no open opportunities right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="card-hover animate-fade-up">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{opportunity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {opportunity.club?.name ?? opportunity.university?.name ?? 'Future Baller'}
                    {opportunity.location ? ` · ${opportunity.location}` : ''}
                    {opportunity.closesAt
                      ? ` · Cierra ${opportunity.closesAt.toLocaleDateString('en-GB')}`
                      : ''}
                  </p>
                </div>
                <Badge variant={opportunity.type === 'SCHOLARSHIP' ? 'success' : 'default'}>
                  {opportunity.type}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
