import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Contrato' };

export default async function AgentContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true },
  });
  if (!contract) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/submissions"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Envíos
      </Link>
      <h1 className="mb-4 text-2xl font-bold">Contrato</h1>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Jugador', `${contract.player.firstName} ${contract.player.lastName}`],
              ['Club', contract.club.name],
              ['Inicio', contract.startsAt.toLocaleDateString('es')],
              ['Fin', contract.endsAt ? contract.endsAt.toLocaleDateString('es') : '—'],
              [
                'Salario',
                contract.salary
                  ? `${contract.salary.toLocaleString('es')} ${contract.currency}/año`
                  : '—',
              ],
              ['Firmado el', contract.signedAt ? contract.signedAt.toLocaleDateString('es') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <Badge
              variant={contract.status === 'ACTIVE' || contract.status === 'SIGNED' ? 'success' : 'warning'}
            >
              {contract.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
