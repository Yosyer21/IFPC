import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'My applications' };

export default async function PlayerApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const applications = await prisma.application.findMany({
    where: { playerId: player.id },
    include: { opportunity: { include: { club: true, university: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">My applications</h1>

      {applications.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't sent any applications yet.{' '}
              <Link href="/dashboard/player/opportunities" className="text-primary hover:underline">
                Ver oportunidades
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/dashboard/player/opportunities/${application.opportunityId}`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{application.opportunity.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {application.opportunity.club?.name ??
                        application.opportunity.university?.name ??
                        '—'}
                      {application.opportunity.type
                        ? ` · ${
                            (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                              application.opportunity.type
                            ] ?? application.opportunity.type
                          }`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enviada el {application.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      application.status === 'ACCEPTED'
                        ? 'success'
                        : application.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {application.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
