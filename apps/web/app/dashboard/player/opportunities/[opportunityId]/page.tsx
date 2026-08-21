import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@future-buller/config';
import { ApplyForm } from '@/components/player/apply-form';
import { saveOpportunityAction, unsaveOpportunityAction } from '@/app/actions/player';

export const metadata: Metadata = { title: 'Oportunidad' };

export default async function PlayerOpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const [opportunity, existingApplication, savedOpportunity] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { club: true, university: true },
    }),
    prisma.application.findUnique({
      where: {
        playerId_opportunityId: { playerId: player.id, opportunityId },
      },
    }),
    prisma.savedOpportunity.findUnique({
      where: {
        playerId_opportunityId: { playerId: player.id, opportunityId },
      },
    }),
  ]);
  if (!opportunity) notFound();

  const typeLabel =
    (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[opportunity.type] ??
    opportunity.type;

  const details: [string, string][] = [
    ['Club', opportunity.club?.name ?? opportunity.university?.name ?? '—'],
    ['Tipo', typeLabel],
    ['Posición', opportunity.position ?? '—'],
    ['Rango de edad', opportunity.ageMin || opportunity.ageMax ? `${opportunity.ageMin ?? '?'}–${opportunity.ageMax ?? '?'} años` : '—'],
    ['Ubicación', opportunity.location ?? '—'],
    ['Cierra el', opportunity.closesAt ? opportunity.closesAt.toLocaleDateString('es') : '—'],
    ['Publicada el', opportunity.createdAt.toLocaleDateString('es')],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/opportunities"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Oportunidades
      </Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
        {savedOpportunity ? (
          <form action={unsaveOpportunityAction}>
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Quitar de guardadas
            </button>
          </form>
        ) : (
          <form action={saveOpportunityAction}>
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Guardar oportunidad
            </button>
          </form>
        )}
      </div>

      <Card className="mb-6">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {opportunity.description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {opportunity.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Enviar solicitud</h2>
          <ApplyForm
            opportunityId={opportunity.id}
            alreadyApplied={Boolean(existingApplication)}
          />
        </CardContent>
      </Card>

      {existingApplication ? (
        <div className="mt-4">
          <Badge variant="warning">Estado: {existingApplication.status}</Badge>
        </div>
      ) : null}
    </div>
  );
}
