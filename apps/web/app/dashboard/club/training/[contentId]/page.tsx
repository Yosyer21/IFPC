import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { TrainingContentDetail } from '@/components/training/content-detail';
import { TrainingContentActions } from '@/components/training/content-actions';
import { trainingPublishState, trainingPublishStateLabel } from '@/lib/training';

export const metadata: Metadata = { title: 'Football Center' };

/** Detalle del contenido que ha publicado un club (solo el suyo). */
export default async function ClubTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!club) notFound();

  const content = await prisma.trainingContent.findFirst({
    where: { id: contentId, clubId: club.id },
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
        series: content.series,
        reps: content.reps,
        restSeconds: content.restSeconds,
        equipment: content.equipment,
        space: content.space,
        players: content.players,
        authorName: null,
      }}
      backHref="/dashboard/club/training"
      backLabel="Football Center"
      actions={
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{trainingPublishStateLabel(content)}</h2>
              <p className="text-xs text-muted-foreground">
                {trainingPublishState(content) === 'PUBLISHED'
                  ? 'The players under contract with the club see it in their Football Center.'
                  : 'The players under contract with the club will see it when it goes live.'}
              </p>
            </div>
            <TrainingContentActions
              contentId={content.id}
              basePath="/dashboard/club/training"
              content={content}
            />
          </CardContent>
        </Card>
      }
    />
  );
}
