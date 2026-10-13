import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { TrainingContentForm } from '@/components/training/content-form';
import { TrainingMediaManager } from '@/components/training/content-media-manager';
import { TrainingQuizForm } from '@/components/training/content-quiz-form';
import { quizQuestionsToText } from '@/lib/training-quiz';

export const metadata: Metadata = { title: 'Edit content' };

const BASE = '/dashboard/club/training';

/**
 * Edición del contenido propio del club: datos, portada y vídeo (subidos desde
 * aquí) y el quiz del curso.
 */
export default async function ClubTrainingEditPage({
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
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: { options: { orderBy: { position: 'asc' } } },
          },
        },
      },
    },
  });
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit content</h1>
        <Link
          href={`${BASE}/${content.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to content
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-semibold">Media</h2>
          <TrainingMediaManager
            contentId={content.id}
            coverUrl={content.thumbnailUrl}
            videoUrl={content.videoUrl}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-4 font-semibold">Details</h2>
          <TrainingContentForm
            content={{
              id: content.id,
              kind: content.kind,
              category: content.category,
              title: content.title,
              description: content.description,
              content: content.content,
              outcomes: content.outcomes,
              videoUrl: content.videoUrl,
              durationMinutes: content.durationMinutes,
              difficulty: content.difficulty,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-semibold">Quiz</h2>
          <TrainingQuizForm
            contentId={content.id}
            hasQuiz={Boolean(content.quiz)}
            title={content.quiz?.title ?? `${content.title} — quiz`}
            passScore={content.quiz?.passScore ?? 70}
            questionsText={content.quiz ? quizQuestionsToText(content.quiz.questions) : ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}
