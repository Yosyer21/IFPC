import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Negociación' };

export default async function AgentNegotiationDetailPage({
  params,
}: {
  params: Promise<{ negotiationId: string }>;
}) {
  const { negotiationId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const negotiation = await prisma.negotiation.findFirst({
    where: { id: negotiationId, club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true, contract: true },
  });
  if (!negotiation) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/submissions"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Envíos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">Negociación</h1>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Jugador', `${negotiation.player.firstName} ${negotiation.player.lastName}`],
              ['Club', negotiation.club.name],
              ['Estado', negotiation.status],
              [
                'Oferta',
                negotiation.offerAmount
                  ? `${negotiation.offerAmount.toLocaleString('es')} ${negotiation.currency}`
                  : '—',
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {negotiation.notes ? (
            <p className="mt-4 text-sm text-muted-foreground">{negotiation.notes}</p>
          ) : null}
          <div className="mt-4">
            <Badge variant={negotiation.status === 'OPEN' ? 'warning' : 'success'}>
              {negotiation.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {negotiation.contract ? (
        <Link
          href={`/dashboard/agent/contracts/${negotiation.contract.id}`}
          className="group"
        >
          <Card className="mt-4 transition-colors group-hover:border-primary">
            <CardContent className="flex items-center justify-between">
              <span className="font-medium">Contrato asociado</span>
              <span className="text-sm text-muted-foreground">{negotiation.contract.status}</span>
            </CardContent>
          </Card>
        </Link>
      ) : null}
    </div>
  );
}
