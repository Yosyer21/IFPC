import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'Oportunidades de mi hijo' };

export default async function ParentChildOpportunitiesPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) notFound();

  const link = await prisma.parentChild.findUnique({
    where: { parentId_playerId: { parentId: parent.id, playerId } },
  });
  if (!link) notFound();

  const [applications, saved, camps] = await Promise.all([
    prisma.application.findMany({
      where: { playerId },
      include: {
        opportunity: { include: { club: true, university: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.savedOpportunity.findMany({
      where: { playerId },
      include: { opportunity: { include: { club: true, university: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campRegistration.findMany({
      where: { playerId },
      include: { camp: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Oportunidades de mi hijo"
        subtitle="Solicitudes enviadas, oportunidades guardadas e inscripciones a camps"
        icon="target"
      >
        <Link
          href={`/dashboard/parent/children/${playerId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mi hijo
        </Link>
      </PageHeader>

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-4 font-semibold">Solicitudes ({applications.length})</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no ha enviado solicitudes.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{application.opportunity.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {application.opportunity.club?.name ??
                        application.opportunity.university?.name ??
                        '—'}
                      {' · '}
                      {application.createdAt.toLocaleDateString('es')}
                    </div>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-4 font-semibold">Guardadas ({saved.length})</h2>
          {saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tiene oportunidades guardadas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {saved.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.opportunity.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.opportunity.club?.name ?? item.opportunity.university?.name ?? '—'}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                      item.opportunity.type
                    ] ?? item.opportunity.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Camps ({camps.length})</h2>
          {camps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No está inscrito en ningún camp.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {camps.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{registration.camp.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {registration.camp.city ?? ''}
                      {registration.camp.country ? `, ${registration.camp.country}` : ''} ·{' '}
                      {registration.camp.startsAt.toLocaleDateString('es')}
                    </div>
                  </div>
                  <StatusBadge status={registration.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


