import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Club' };

export default async function AgentClubDetailPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { opportunities: { where: { status: 'OPEN' }, take: 5 } },
  });
  if (!club) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/opportunities"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Oportunidades
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{club.name}</h1>
      <Badge variant={club.verified ? 'success' : 'warning'}>
        {club.verified ? 'Verificado' : 'Pending verification'}
      </Badge>

      <Card className="mt-4 mb-4">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Country', club.country],
              ['Ciudad', club.city ?? '—'],
              ['Liga', club.league ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {club.opportunities.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Oportunidades abiertas</h2>
          {club.opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardContent>
                <p className="text-sm font-medium">{opportunity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {opportunity.position ? `Position: ${opportunity.position}` : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
