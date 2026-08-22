import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { updateOpportunityStatusAction } from '@/app/actions/admin';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'Oportunidad' };

export default async function AdminOpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      club: true,
      university: true,
      applications: { include: { player: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!opportunity) notFound();

  const creator =
    opportunity.creatorType === 'UNIVERSITY' ? opportunity.university?.name : opportunity.club?.name;
  const typeLabel =
    (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[opportunity.type] ??
    opportunity.type;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={opportunity.title} subtitle={creator ?? 'Oportunidad'}>
        <Link href="/dashboard/admin/opportunities" className="text-sm text-muted-foreground hover:underline">
          ← Oportunidades
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Tipo</div>
            <div className="mt-1 text-sm font-semibold">{typeLabel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Estado</div>
            <div className="mt-1">
              <StatusBadge status={opportunity.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Solicitudes</div>
            <div className="mt-1 text-sm font-semibold">{opportunity.applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Cierra el</div>
            <div className="mt-1 text-sm font-semibold">
              {opportunity.closesAt ? opportunity.closesAt.toLocaleDateString('es') : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-3 text-xs">
            {opportunity.position ? <Badge variant="outline">Posición: {opportunity.position}</Badge> : null}
            {opportunity.ageMin || opportunity.ageMax ? (
              <Badge variant="outline">
                Edad: {opportunity.ageMin ?? '?'}–{opportunity.ageMax ?? '?'}
              </Badge>
            ) : null}
            {opportunity.location ? <Badge variant="outline">Ubicación: {opportunity.location}</Badge> : null}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {opportunity.description ?? 'Sin descripción.'}
          </p>

          <form action={updateOpportunityStatusAction} className="mt-4 flex items-center gap-2">
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <select
              name="status"
              defaultValue={opportunity.status}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="DRAFT">Borrador</option>
              <option value="OPEN">Abierta</option>
              <option value="CLOSED">Cerrada</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Actualizar estado
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Solicitudes ({opportunity.applications.length})</h2>
          {opportunity.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay solicitudes para esta oportunidad.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {opportunity.applications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {application.player.firstName} {application.player.lastName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {application.player.position ?? 'Sin posición'} ·{' '}
                      {application.createdAt.toLocaleDateString('es')}
                      {application.message ? ` · "${application.message.slice(0, 90)}"` : ''}
                    </div>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


