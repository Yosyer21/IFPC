import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Negociaciones' };

export default async function AgentNegotiationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const negotiations = await prisma.negotiation.findMany({
    where: { club: { submissions: { some: { agentId: agent.id } } } },
    include: { player: true, club: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Negociaciones"
        subtitle="Negotiation conditions for your represented players"
        icon="briefcase"
      />

      {negotiations.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No open negotiations. When a club starts a negotiation after a trial,
              it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {negotiations.map((negotiation, i) => (
            <Link
              key={negotiation.id}
              href={`/dashboard/agent/negotiations/${negotiation.id}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card className="card-hover">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {negotiation.player.firstName} {negotiation.player.lastName}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {negotiation.club.name}
                      {negotiation.offerAmount
                        ? ` · Oferta: ${negotiation.offerAmount.toLocaleString('en')} ${negotiation.currency}`
                        : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {negotiation.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge variant={negotiation.status === 'OPEN' ? 'warning' : 'success'}>
                    {negotiation.status}
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
