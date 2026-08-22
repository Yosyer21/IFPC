import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent, Progress } from '@ifpc/ui';

import { profileCompletionPercentage } from '@ifpc/config';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Mi desarrollo' };

export default async function PlayerDevelopmentPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const fields = [
    player.firstName,
    player.lastName,
    player.dateOfBirth,
    player.nationality,
    player.position,
    player.foot,
    player.heightCm,
    player.weightKg,
    player.competitionLevel,
    player.clubName,
    player.bio,
  ];
  const percent = profileCompletionPercentage(fields);

  const [pendingGoals, evaluationCount, videoCount] = await Promise.all([
    prisma.playerGoal.count({
      where: { playerId: player.id, status: { in: ['pending', 'in_progress'] } },
    }),
    prisma.evaluation.count({ where: { playerId: player.id } }),
    prisma.video.count({ where: { playerId: player.id } }),
  ]);

  const summary = [
    { href: '/dashboard/player/development/goals', label: 'Objetivos activos', value: pendingGoals },
    { href: '/dashboard/player/development/evaluations', label: 'Evaluaciones', value: evaluationCount },
    { href: '/dashboard/player/development/progress', label: 'Mi progreso', value: `${Math.round(((pendingGoals > 0 ? 1 : 0) + (evaluationCount > 0 ? 1 : 0) + (videoCount > 0 ? 1 : 0)) * 100 / 3)}%` },
    { href: '/dashboard/player/videos', label: 'Vídeos subidos', value: videoCount },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Mi desarrollo"
        subtitle="Tu evolución como jugador: perfil, objetivos, evaluaciones y progreso"
        icon="trending"
      />

      <Card className="mb-4">
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Perfil completado</h2>
            <span className="text-sm font-medium text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent className="text-center">
                <div className="text-3xl font-bold">{item.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link href="/dashboard/player/training" className="text-sm text-primary hover:underline">
          → Continuar entrenamiento
        </Link>
        <Link href="/dashboard/player/pathway" className="text-sm text-primary hover:underline">
          → Ver mi ruta de desarrollo
        </Link>
      </div>
    </div>
  );
}
