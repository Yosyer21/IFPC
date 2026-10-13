import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import type { TrainingContent } from '@ifpc/types';
import { TRAINING_CATEGORY_LABELS } from '@/lib/labels';

export function TrainingGrid({
  contents,
  quizzesByContentId = {},
}: {
  contents: TrainingContent[];
  /** `contentId` -> número de preguntas del quiz (para el badge "Quiz"). */
  quizzesByContentId?: Record<string, number>;
}) {
  if (contents.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No content available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contents.map((content) => {
        const questions = quizzesByContentId[content.id] ?? 0;
        return (
          <Link key={content.id} href={`/dashboard/player/training/${content.id}`} className="group">
            <Card className="card-hover h-full">
              <CardContent className="flex h-full flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{TRAINING_CATEGORY_LABELS[content.category] ?? content.category}</Badge>
                  {questions > 0 ? <Badge variant="outline">Quiz · {questions}</Badge> : null}
                </div>
                <h2 className="mt-3 font-semibold">{content.title}</h2>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {content.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {content.durationMinutes ? <span>{content.durationMinutes} min</span> : null}
                  {content.difficulty ? <span>Level {content.difficulty}/5</span> : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
