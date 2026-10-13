import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { TrainingContentDetail } from '@/components/training/content-detail';
import { DeleteTrainingContentButton } from '@/components/training/content-actions';

export const metadata: Metadata = { title: 'Football Center' };

/** Detalle del contenido que ha publicado un coach (solo lo suyo). */
export default async function CoachTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) notFound();

  const content = await prisma.trainingContent.findFirst({
    where: { id: contentId, coachId: coach.id },
  });
  if (!content) notFound();

  return (
    <TrainingContentDetail
      content={{
        id: content.id,
        title: content.title,
        category: content.category,
        kind: content.kind,
        ownerType: content.ownerType,
        description: content.description,
        content: content.content,
        outcomes: content.outcomes,
        videoUrl: content.videoUrl,
        durationMinutes: content.durationMinutes,
        difficulty: content.difficulty,
        authorName: null,
      }}
      backHref="/dashboard/coach/training"
      backLabel="Football Center"
      actions={
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Published content</h2>
              <p className="text-xs text-muted-foreground">
                Your players see it in their own Football Center.
              </p>
            </div>
            <DeleteTrainingContentButton contentId={content.id} />
          </CardContent>
        </Card>
      }
    />
  );
}
