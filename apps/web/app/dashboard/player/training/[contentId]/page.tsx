import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Contenido' };

export default async function PlayerTrainingDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const content = await prisma.trainingContent.findUnique({ where: { id: contentId } });
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/training"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Entrenamiento
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{content.title}</h1>
      <div className="mb-4 flex items-center gap-3">
        <Badge>{content.category}</Badge>
        {content.durationMinutes ? (
          <span className="text-sm text-muted-foreground">{content.durationMinutes} min</span>
        ) : null}
        {content.difficulty ? (
          <span className="text-sm text-muted-foreground">Nivel {content.difficulty}/5</span>
        ) : null}
      </div>

      {content.videoUrl ? (
        <video
          src={content.videoUrl}
          controls
          className="aspect-video w-full rounded-lg border border-border bg-black"
        />
      ) : null}

      {content.description ? (
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
