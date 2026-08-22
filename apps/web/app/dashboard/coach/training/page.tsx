import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { IconBook, IconPlay, IconStar, IconWhistle } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Entrenamiento' };

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  'strength-conditioning': 'Fuerza y condición',
  psychology: 'Psicología',
};

export default async function CoachTrainingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [content, coachWithPlayers] = await Promise.all([
    prisma.trainingContent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.coach.findUnique({
      where: { userId: session.user.id },
      include: { players: { include: { player: true } } },
    }),
  ]);

  const categories = new Set(content.map((item) => item.category));
  const totalPlayers = coachWithPlayers?.players.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Entrenamiento"
        subtitle="Catálogo de ejercicios para planificar el desarrollo de tus jugadores"
        icon="play"
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard href="/dashboard/coach/training" icon={IconPlay} label="Ejercicios" value={content.length} />
        <StatCard href="/dashboard/coach/training" icon={IconBook} label="Categorías" value={categories.size} />
        <StatCard href="/dashboard/coach/players" icon={IconWhistle} label="Mis jugadores" value={totalPlayers} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = content.filter((item) => item.category === key).length;
          return (
            <Badge key={key} variant="outline">
              {label}: {count}
            </Badge>
          );
        })}
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todavía no hay contenido de entrenamiento publicado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <Link key={item.id} href="/dashboard/player/training">
              <Card className="card-hover h-full">
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconStar className="h-3.5 w-3.5" />
                      <span>{item.difficulty ?? '—'}/5</span>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.durationMinutes ? `${item.durationMinutes} min` : 'Sin duración'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}



