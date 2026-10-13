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
import { TrainingSessionActions } from '@/components/training/session-actions';
import { TrainingSessionCard } from '@/components/training/session-card';
import { TrainingSessionForm } from '@/components/training/session-form';
import { IconBook, IconPlay, IconUsers } from '@/components/dashboard/icons';
import { clubPlayerCount, listAuthoredTraining } from '@/lib/training';
import { listAuthoredTrainingSessions } from '@/lib/training-sessions';

export const metadata: Metadata = { title: 'Football Center' };

/**
 * Football Center del club: publica cursos y ejercicios para los jugadores que
 * tiene en plantilla (contrato firmado o activo) y gestiona lo ya publicado.
 */
export default async function ClubFootballCenterPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!club) notFound();

  const [items, players, sessions] = await Promise.all([
    listAuthoredTraining({ clubId: club.id }),
    clubPlayerCount(club.id),
    listAuthoredTrainingSessions({ clubId: club.id }),
  ]);

  const courses = items.filter((item) => item.kind === 'COURSE');
  const exercises = items.filter((item) => item.kind === 'EXERCISE');

  const published = (list: typeof items, kind: 'COURSE' | 'EXERCISE') => (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {players === 0
          ? 'You have no players under contract yet: their content will show up when you sign them.'
          : `Visible for the ${players} player${players === 1 ? '' : 's'} under contract with the club.`}
      </p>
      <TrainingContentGrid
        items={list}
        basePath="/dashboard/club/training"
        showPublishState
        renderActions={(item) => (
          <TrainingContentActions
            contentId={item.id}
            basePath="/dashboard/club/training"
            content={item}
          />
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

  const sessionsTab = (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {players === 0
          ? 'You have no players under contract yet: their sessions will show up when you sign them.'
          : `Visible for the ${players} player${players === 1 ? '' : 's'} under contract with the club.`}
      </p>
      <div className="flex flex-col gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No sessions yet: create the first one below and add the club exercises to it.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((entry) => (
            <TrainingSessionCard
              key={entry.id}
              session={entry}
              contentBasePath="/dashboard/club/training"
              showPublishState
              renderActions={(session) => (
                <TrainingSessionActions session={session} basePath="/dashboard/club/training" />
              )}
            />
          ))
        )}
      </div>
      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">New session</h2>
          <TrainingSessionForm />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Football Center"
        subtitle="Publish courses, exercises and sessions for the players in your squad"
        icon="play"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          href="/dashboard/club/training"
          icon={IconBook}
          label="Courses"
          value={courses.length}
        />
        <StatCard
          href="/dashboard/club/training"
          icon={IconPlay}
          label="Exercises"
          value={exercises.length}
        />
        <StatCard
          href="/dashboard/club/players"
          icon={IconUsers}
          label="Players in squad"
          value={players}
        />
      </div>

      <Tabs
        tabs={[
          { value: 'courses', label: 'Courses', content: published(courses, 'COURSE') },
          { value: 'exercises', label: 'Exercises', content: published(exercises, 'EXERCISE') },
          { value: 'sessions', label: 'Sessions', content: sessionsTab },
        ]}
        defaultValue="courses"
      />
    </div>
  );
}
