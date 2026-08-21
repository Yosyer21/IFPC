import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Guía para familias' };

export default async function ParentEducationArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const content = await prisma.trainingContent.findUnique({ where: { id: articleId } });
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/parent/education"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Educación para familias
      </Link>
      <div className="animate-fade-up mb-4">
        <Badge>Guía para familias</Badge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{content.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {content.durationMinutes ? <span>{content.durationMinutes} min</span> : null}
          {content.difficulty ? <span>Nivel {content.difficulty}/5</span> : null}
        </div>
      </div>

      {content.description ? (
        <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}


