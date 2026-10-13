import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { TrainingContentDetail } from '@/components/training/content-detail';
import { TrainingContentActions } from '@/components/training/content-actions';
import { trainingPublishState, trainingPublishStateLabel } from '@/lib/training';

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
              <h2 className="font-semibold">{trainingPublishStateLabel(content)}</h2>
              <p className="text-xs text-muted-foreground">
                {trainingPublishState(content) === 'PUBLISHED'
                  ? 'Your players see it in their own Football Center.'
                  : 'Your players will see it in their own Football Center when it goes live.'}
              </p>
            </div>
            <TrainingContentActions
              contentId={content.id}
              basePath="/dashboard/coach/training"
              content={content}
            />
          </CardContent>
        </Card>
      }
    />
  );
}
