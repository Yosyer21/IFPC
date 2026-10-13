import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent, Tabs } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { TrainingContentForm } from '@/components/training/content-form';
import { TrainingContentGrid } from '@/components/training/content-grid';
import { TrainingContentActions } from '@/components/training/content-actions';
import { IconBook, IconPlay, IconUsers } from '@/components/dashboard/icons';
import { coachPlayerCount, listAuthoredTraining } from '@/lib/training';

export const metadata: Metadata = { title: 'Football Center' };

/**
 * Football Center del coach: publica cursos y ejercicios que verán **sus**
 * jugadores (los vinculados por `CoachPlayer`) y gestiona lo ya publicado.
 */
export default async function CoachFootballCenterPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) notFound();

  const [items, players] = await Promise.all([
    listAuthoredTraining({ coachId: coach.id }),
    coachPlayerCount(coach.id),
  ]);

  const courses = items.filter((item) => item.kind === 'COURSE');
  const exercises = items.filter((item) => item.kind === 'EXERCISE');

  const published = (list: typeof items, kind: 'COURSE' | 'EXERCISE') => (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {players === 0
          ? 'You have no players linked yet: add them from My players to share this content.'
          : `Visible for the ${players} player${players === 1 ? '' : 's'} linked to you.`}
      </p>
      <TrainingContentGrid
        items={list}
        basePath="/dashboard/coach/training"
        renderActions={(item) => (
          <TrainingContentActions contentId={item.id} basePath="/dashboard/coach/training" />
        )}
      />
      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">New {kind === 'COURSE' ? 'course' : 'exercise'}</h2>
          <TrainingContentForm defaultKind={kind} />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Football Center"
        subtitle="Publish courses and exercises for your players"
        icon="play"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          href="/dashboard/coach/training"
          icon={IconBook}
          label="My courses"
          value={courses.length}
        />
        <StatCard
          href="/dashboard/coach/training"
          icon={IconPlay}
          label="My exercises"
          value={exercises.length}
        />
        <StatCard
          href="/dashboard/coach/players"
          icon={IconUsers}
          label="My players"
          value={players}
        />
      </div>

      <Tabs
        tabs={[
          { value: 'courses', label: 'My courses', content: published(courses, 'COURSE') },
          { value: 'exercises', label: 'My exercises', content: published(exercises, 'EXERCISE') },
        ]}
        defaultValue="courses"
      />
    </div>
  );
}
