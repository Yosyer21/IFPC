import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Educación para familias' };

export default async function ParentEducationPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const contents = await prisma.trainingContent.findMany({
    where: { category: 'parent-education' },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Educación para familias"
        subtitle="Guías y recursos para acompañar la carrera deportiva de tu hijo"
        icon="book"
      />

      {contents.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay guías publicadas todavía. Vuelve pronto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content, i) => (
            <Link
              key={content.id}
              href={`/dashboard/parent/education/${content.id}`}
              className="animate-fade-up group block"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card className="card-hover h-full">
                <CardContent className="flex h-full flex-col gap-2">
                  <Badge>Guía para familias</Badge>
                  <h2 className="font-semibold">{content.title}</h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {content.description}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                    {content.durationMinutes ? <span>{content.durationMinutes} min</span> : null}
                    {content.difficulty ? <span>Nivel {content.difficulty}/5</span> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
