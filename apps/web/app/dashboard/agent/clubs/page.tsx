import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconBriefcase } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Clubes' };

export default async function AgentClubsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const clubs = await prisma.club.findMany({
    where: { submissions: { some: { agentId: agent.id } } },
    include: { _count: { select: { opportunities: { where: { status: 'OPEN' } } } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Clubes"
        subtitle="Clubes con los que tienes relación a través de envíos"
        icon="briefcase"
      />

      {clubs.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no has tenido relación con clubes. Haz un{' '}
              <Link href="/dashboard/agent/submissions/new" className="text-primary hover:underline">
                nuevo envío
              </Link>{' '}
              para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {clubs.map((club, i) => (
            <Link
              key={club.id}
              href={`/dashboard/agent/clubs/${club.id}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card className="card-hover">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconBriefcase className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{club.name}</h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {club.city ? `${club.city}, ` : ''}
                        {club.country}
                        {club.league ? ` · ${club.league}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">
                    {club._count.opportunities} oportunidad
                    {club._count.opportunities === 1 ? '' : 'es'} abierta
                    {club._count.opportunities === 1 ? '' : 's'}
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
