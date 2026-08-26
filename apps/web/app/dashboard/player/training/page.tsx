import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Tabs } from '@ifpc/ui';
import { TrainingGrid } from '@/components/player/training-grid';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Entrenamiento' };

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'technical', label: 'Technique' },
  { value: 'strength-conditioning', label: 'Fuerza' },
  { value: 'psychology', label: 'Psychology' },
] as const;

export default async function PlayerTrainingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const tabs = CATEGORIES.map((category) => ({
    value: category.value,
    label: category.label,
    content:
      category.value === 'all' ? (
        <TrainingGrid contents={contents} />
      ) : (
        <TrainingGrid
          contents={contents.filter((content) => content.category === category.value)}
        />
      ),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Entrenamiento"
        subtitle="Content to improve your technique, strength and mindset"
        icon="play"
      />
      <Tabs tabs={tabs} defaultValue="all" />
    </div>
  );
}
