import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';

export const metadata: Metadata = { title: 'Oportunidades guardadas' };

export default async function PlayerSavedOpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const saved = await prisma.savedOpportunity.findMany({
    where: { playerId: player.id },
    include: { opportunity: { include: { club: true, university: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Oportunidades guardadas</h1>

      {saved.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't saved any opportunity yet.{' '}
              <Link href="/dashboard/player/opportunities" className="text-primary hover:underline">
                Explorar oportunidades
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/player/opportunities/${item.opportunityId}`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{item.opportunity.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.opportunity.club?.name ?? item.opportunity.university?.name ?? '—'}
                      {item.opportunity.type
                        ? ` · ${
                            (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                              item.opportunity.type
                            ] ?? item.opportunity.type
                          }`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Guardada el {item.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge>Guardada</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
