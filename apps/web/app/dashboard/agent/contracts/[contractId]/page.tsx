import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Contract' };

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
        ← Submissions
      </Link>
      <h1 className="mb-4 text-2xl font-bold">Contract</h1>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Player', `${contract.player.firstName} ${contract.player.lastName}`],
              ['Club', contract.club.name],
              ['Inicio', contract.startsAt.toLocaleDateString('en-GB')],
              ['Fin', contract.endsAt ? contract.endsAt.toLocaleDateString('en-GB') : '—'],
              [
                'Salario',
                contract.salary
                  ? `${contract.salary.toLocaleString('en')} ${contract.currency}/year`
                  : '—',
              ],
              ['Signed on', contract.signedAt ? contract.signedAt.toLocaleDateString('en-GB') : '—'],
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
