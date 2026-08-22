import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata: Metadata = { title: 'Entrenamiento de mi hijo' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  'strength-conditioning': 'Fuerza y condición',
  psychology: 'Psicología',
  'parent-education': 'Para familias',
};

export default async function ParentChildTrainingPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) notFound();

  const link = await prisma.parentChild.findUnique({
    where: { parentId_playerId: { parentId: parent.id, playerId } },
  });
  if (!link) notFound();

  const [player, content, sessions] = await Promise.all([
    prisma.player.findUnique({
      where: { id: playerId },
      include: { coaches: { include: { coach: { include: { user: true } } } } },
    }),
    prisma.trainingContent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.liveSession.findMany({
      where: { playerId },
      include: { coach: { include: { user: true } } },
      orderBy: { startsAt: 'desc' },
      take: 20,
    }),
  ]);
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`Entrenamiento · ${player.firstName}`}
        subtitle="Sesiones en vivo y contenido de entrenamiento recomendado"
        icon="play"
      >
        <Link
          href={`/dashboard/parent/children/${playerId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mi hijo
        </Link>
      </PageHeader>

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-4 font-semibold">Sesiones en vivo ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu hijo no tiene sesiones en vivo asignadas.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map((liveSession) => (
                <div
                  key={liveSession.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{liveSession.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {liveSession.startsAt.toLocaleDateString('es')}{' '}
                      {liveSession.startsAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      {liveSession.coach?.user?.name ? ` · ${liveSession.coach.user.name}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={liveSession.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Contenido de entrenamiento</h2>
          {content.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay contenido publicado.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {content.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                      {item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}
                      {item.difficulty ? ` · Nivel ${item.difficulty}/5` : ''}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/parent/children/${playerId}/training`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


