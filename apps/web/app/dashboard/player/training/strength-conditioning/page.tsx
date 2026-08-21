import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { TrainingGrid } from '@/components/player/training-grid';

export const metadata: Metadata = { title: 'Entrenamiento · Fuerza' };

export default async function PlayerTrainingStrengthPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category: 'strength-conditioning' },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Fuerza y acondicionamiento</h1>
      <TrainingGrid contents={contents} />
    </div>
  );
}
