import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Tabs } from '@ifpc/ui';
import { TrainingGrid } from '@/components/player/training-grid';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Training' };

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'technical', label: 'Technique' },
  { value: 'strength-conditioning', label: 'Strength & conditioning' },
] as const;

export default async function PlayerTrainingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category: { in: ['technical', 'strength-conditioning'] } },
    orderBy: { createdAt: 'asc' },
    include: { quiz: { select: { _count: { select: { questions: true } } } } },
  });

  const quizzesByContentId = Object.fromEntries(
    contents
      .filter((content) => content.quiz)
      .map((content) => [content.id, content.quiz?._count.questions ?? 0])
  );

  const tabs = CATEGORIES.map((category) => ({
    value: category.value,
    label: category.label,
    content: (
      <TrainingGrid
        contents={contents.filter(
          (content) => category.value === 'all' || content.category === category.value
        )}
        quizzesByContentId={quizzesByContentId}
      />
    ),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Training"
        subtitle="Content to improve your technique, strength and mindset"
        icon="play"
      />
      <Tabs tabs={tabs} defaultValue="all" />
    </div>
  );
}
