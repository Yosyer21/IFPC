import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS, POSITION_LABELS } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';
import { PlayerAvatar } from '@/components/player/avatar';

export const metadata: Metadata = { title: 'Applications recibidas' };

const APPLICATION_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
  WITHDRAWN: { label: 'Retirada', variant: 'default' },
};

export default async function ClubApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const applications = await prisma.application.findMany({
    where: { opportunity: { clubId: club.id } },
    include: { player: true, opportunity: true },
    orderBy: { createdAt: 'desc' },
  });

  // Pendientes primero, luego por fecha
  const ordered = [...applications].sort((a, b) => {
    const rank = (status: string) => (status === 'PENDING' ? 0 : 1);
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Applications recibidas"
        subtitle="Candidatos que han aplicado a tus oportunidades"
        icon="mail"
      >
        {pendingCount > 0 ? (
          <Badge variant="warning">{pendingCount} pendientes</Badge>
        ) : null}
      </PageHeader>

      {ordered.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You haven't received applications yet. Post opportunities so players can
              aplicar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {ordered.map((application, i) => {
            const status = APPLICATION_STATUS_LABELS[application.status] ?? {
              label: application.status,
              variant: 'default',
            };
            const positionLabel = application.player.position
              ? ((POSITION_LABELS as Record<string, string | undefined>)[
                  application.player.position
                ] ?? application.player.position)
              : 'Undefined position';
            return (
              <Link
                key={application.id}
                href={`/dashboard/club/players/${application.playerId}`}
                className="animate-fade-up group block"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Card className="card-hover">
                  <CardContent className="flex items-center gap-4">
                    <PlayerAvatar
                      firstName={application.player.firstName}
                      lastName={application.player.lastName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {application.player.firstName} {application.player.lastName}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {positionLabel}
                        {application.player.competitionLevel
                          ? ` · ${application.player.competitionLevel}`
                          : ''}
                        {application.player.nationality ? ` · ${application.player.nationality}` : ''}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        Requested:{' '}
                        {application.opportunity.title}
                        {application.opportunity.type
                          ? ` · ${
                              (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                                application.opportunity.type
                              ] ?? application.opportunity.type
                            }`
                          : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {application.createdAt.toLocaleDateString('es')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
