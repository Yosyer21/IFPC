import Link from 'next/link';
import { Badge, Card, CardContent } from '@future-buller/ui';
import type { TrainingContent } from '@future-buller/types';

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Técnica',
  'strength-conditioning': 'Fuerza y acondicionamiento',
  psychology: 'Psicología',
  'parent-education': 'Educación para padres',
};

export function TrainingGrid({ contents }: { contents: TrainingContent[] }) {
  if (contents.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay contenido disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contents.map((content) => (
        <Link
          key={content.id}
          href={`/dashboard/player/training/${content.id}`}
          className="group"
        >
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent>
              <Badge>{CATEGORY_LABELS[content.category] ?? content.category}</Badge>
              <h2 className="mt-3 font-semibold">{content.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {content.description}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {content.durationMinutes ? <span>{content.durationMinutes} min</span> : null}
                {content.difficulty ? <span>Nivel {content.difficulty}/5</span> : null}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
