import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Contratos' };

export default async function AgentContractsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const contracts = await prisma.contract.findMany({
    where: { club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Contratos"
        subtitle="Contratos firmados o en proceso para tus representados"
        icon="file"
      />

      {contracts.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay contratos registrados. Cuando se cierre una negociación con contrato,
              aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {contracts.map((contract, i) => (
            <Link
              key={contract.id}
              href={`/dashboard/agent/contracts/${contract.id}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card className="card-hover">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {contract.player.firstName} {contract.player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {contract.club.name}
                      {contract.salary
                        ? ` · ${contract.salary.toLocaleString('es')} ${contract.currency}/año`
                        : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {contract.startsAt.toLocaleDateString('es')}
                      {contract.endsAt ? ` → ${contract.endsAt.toLocaleDateString('es')}` : ''}
                    </p>
                  </div>
                  <Badge
                    variant={
                      contract.status === 'ACTIVE' || contract.status === 'SIGNED'
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {contract.status}
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
