import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { Tabs } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { TrainingSection } from '@/components/training/content-section';
import { TrainingSessionSection } from '@/components/training/session-section';
import { TrainingProgressPanel } from '@/components/training/progress-panel';
import { listPlayerTraining, playerTrainingSummary, splitTraining } from '@/lib/training';
import { listPlayerTrainingSessions, splitTrainingSessions } from '@/lib/training-sessions';
import type { TrainingKind } from '@ifpc/config';

export const metadata: Metadata = { title: 'Football Center' };

/**
 * Football Center del jugador: cursos, ejercicios, **plan semanal** (las sesiones
 * que le montan su coach y su club) y su progreso. Cada pestaña separa el contenido
 * por origen: general (la plataforma), de su coach y de su club.
 */
export default async function PlayerFootballCenterPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { audience, items } = await listPlayerTraining(session.user.id);
  const [summary, plan] = await Promise.all([
    playerTrainingSummary(items, audience.playerId),
    listPlayerTrainingSessions(session.user.id),
  ]);

  const grouped = (kind: TrainingKind) => {
    const groups = splitTraining(items, kind);
    const total = groups.general.length + groups.coach.length + groups.club.length;
    if (total === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No {kind === 'COURSE' ? 'courses' : 'exercises'} available yet. Content from your coach
          and your club will show up here too.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <TrainingSection
          title="General"
          subtitle="Basics from Future Baller"
          items={groups.general}
        />
        <TrainingSection
          title="From your coach"
          subtitle="Published by the coaches you are linked to"
          items={groups.coach}
        />
        <TrainingSection
          title="From your club"
          subtitle="Published by the clubs you play for"
          items={groups.club}
        />
      </div>
    );
  };

  const planGroups = splitTrainingSessions(plan.sessions);
  const planTab = (
    <div className="flex flex-col gap-6">
      {plan.sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sessions yet. When your coach or your club publishes a plan it will show up here with
          its exercises in order.
        </p>
      ) : (
        <>
          <TrainingSessionSection
            title="General"
            subtitle="Plans from Future Baller"
            sessions={planGroups.general}
          />
          <TrainingSessionSection
            title="From your coach"
            subtitle="Plans built by the coaches you are linked to"
            sessions={planGroups.coach}
          />
          <TrainingSessionSection
            title="From your club"
            subtitle="Plans built by the clubs you play for"
            sessions={planGroups.club}
          />
        </>
      )}
    </div>
  );

  const tabs = [
    { value: 'courses', label: 'Courses', content: grouped('COURSE') },
    { value: 'exercises', label: 'Exercises', content: grouped('EXERCISE') },
    { value: 'plan', label: 'Weekly plan', content: planTab },
    {
      value: 'progress',
      label: 'My progress',
      content: <TrainingProgressPanel summary={summary} />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Football Center"
        subtitle="Courses, exercises, your weekly plan and your progress: general, from your coach and from your club"
        icon="play"
      />
      <Tabs tabs={tabs} defaultValue="courses" />
    </div>
  );
}
