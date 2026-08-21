import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { TrainingGrid } from '@/components/player/training-grid';

export const metadata: Metadata = { title: 'Entrenamiento · Técnica' };

export default async function PlayerTrainingTechnicalPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category: 'technical' },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Técnica</h1>
      <TrainingGrid contents={contents} />
    </div>
  );
}
