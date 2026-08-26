import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Development pathway' };

export default async function PlayerPathwayDetailPage({
  params,
}: {
  params: Promise<{ pathwayId: string }>;
}) {
  const { pathwayId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const pathway = await prisma.pathway.findFirst({
    where: { id: pathwayId, player: { userId: session.user.id } },
  });
  if (!pathway) notFound();

  const formatDate = (date: Date | null) =>
    date ? date.toLocaleDateString('es') : '—';

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/pathway"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mi ruta
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{pathway.title}</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant={pathway.status === 'active' ? 'success' : 'default'}>
          {pathway.status}
        </Badge>
        {pathway.level ? <span className="text-sm text-muted-foreground">{pathway.level}</span> : null}
        <span className="text-sm text-muted-foreground">
          {formatDate(pathway.startsAt)} → {formatDate(pathway.endsAt)}
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          {pathway.description ? (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground">{pathway.description}</p>
            </div>
          ) : null}
          {pathway.focus ? (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Focus areas</h2>
              <p className="text-sm text-muted-foreground">{pathway.focus}</p>
            </div>
          ) : null}
          {pathway.goals ? (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Goals</h2>
              <p className="text-sm text-muted-foreground">{pathway.goals}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
