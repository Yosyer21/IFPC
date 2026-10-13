import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { Tabs } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { TrainingSection } from '@/components/training/content-section';
import { TrainingProgressPanel } from '@/components/training/progress-panel';
import { listPlayerTraining, playerTrainingSummary, splitTraining } from '@/lib/training';
import type { TrainingKind } from '@ifpc/config';

export const metadata: Metadata = { title: 'Football Center' };

/**
 * Football Center del jugador: tres pestañas (cursos, ejercicios y su progreso) y,
 * dentro de cada una, el contenido dividido por origen — general (la plataforma),
 * de su coach y de su club —.
 */
export default async function PlayerFootballCenterPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { audience, items } = await listPlayerTraining(session.user.id);
  const summary = await playerTrainingSummary(items, audience.playerId);

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

  const tabs = [
    { value: 'courses', label: 'Courses', content: grouped('COURSE') },
    { value: 'exercises', label: 'Exercises', content: grouped('EXERCISE') },
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
        subtitle="Courses, exercises and your progress: general, from your coach and from your club"
        icon="play"
      />
      <Tabs tabs={tabs} defaultValue="courses" />
    </div>
  );
}
