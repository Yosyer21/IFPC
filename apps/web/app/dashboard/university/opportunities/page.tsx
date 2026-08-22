import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { IconBook } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Oportunidades' };

export default async function UniversityOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Oportunidades"
        subtitle="Becas y convocatorias abiertas para orientar a tus candidatos"
        icon="target"
      />

      {opportunities.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No hay oportunidades abiertas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity, i) => {
            const isScholarship = opportunity.type === 'SCHOLARSHIP';
            return (
              <Card
                key={opportunity.id}
                className={`card-hover animate-fade-up h-full ${
                  isScholarship ? 'border-emerald-500/40' : ''
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {isScholarship ? (
                      <Badge variant="success">Beca</Badge>
                    ) : (
                      <Badge>
                        {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                          opportunity.type
                        ] ?? opportunity.type}
                      </Badge>
                    )}
                    <Badge variant="success">Abierta</Badge>
                  </div>
                  <h2 className="font-semibold">{opportunity.title}</h2>
                  <p className="text-sm text-muted-foreground">
                  {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                </p>
                  <p className="text-xs text-muted-foreground">
                    {opportunity.position ? `Posición: ${opportunity.position}` : ''}
                    {opportunity.ageMin || opportunity.ageMax
                      ? ` · ${opportunity.ageMin ?? '?'}–${opportunity.ageMax ?? '?'} años`
                      : ''}
                    {opportunity.location ? ` · ${opportunity.location}` : ''}
                  </p>
                  {opportunity.closesAt ? (
                    <p className="text-xs text-muted-foreground">
                      Cierra el {opportunity.closesAt.toLocaleDateString('es')}
                    </p>
                  ) : null}
                  {isScholarship ? (
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <IconBook className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Compatible con estudios superiores
                      </span>
                    </div>
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
