import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { TrainingGrid } from '@/components/player/training-grid';

export const metadata: Metadata = { title: 'Entrenamiento · Psicología' };

export default async function PlayerTrainingPsychologyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category: 'psychology' },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Psicología deportiva</h1>
      <TrainingGrid contents={contents} />
    </div>
  );
}
