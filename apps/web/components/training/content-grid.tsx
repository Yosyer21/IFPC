import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { trainingCategoryLabel } from '@ifpc/config';
import { trainingPublishState, type TrainingItem } from '@/lib/training';

export interface TrainingContentGridProps {
  items: TrainingItem[];
  /** Ruta del detalle (por defecto, la del jugador). */
  basePath?: string;
  /** Marca los elementos con acciones del autor (editar, publicar, borrar). */
  renderActions?: (item: TrainingItem) => React.ReactNode;
  /** Muestra el estado de publicación (vista del autor, no la del jugador). */
  showPublishState?: boolean;
}

/**
 * Rejilla de cursos o ejercicios del Football Center. La comparten las pestañas
 * del jugador (agrupadas por origen) y los listados del coach y del club.
 */
export function TrainingContentGrid({
  items,
  basePath = '/dashboard/player/training',
  renderActions,
  showPublishState = false,
}: TrainingContentGridProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No content here yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const state = showPublishState ? trainingPublishState(item) : null;
        return (
          <Card key={item.id} className="card-hover h-full">
            <CardContent className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                {state === 'DRAFT' ? <Badge variant="warning">Draft</Badge> : null}
                {state === 'SCHEDULED' ? <Badge variant="outline">Scheduled</Badge> : null}
                {item.scope === 'SELECTED' ? (
                  showPublishState ? (
                    <Badge variant="outline">
                      Only {item.targetCount} player{item.targetCount === 1 ? '' : 's'}
                    </Badge>
                  ) : (
                    <Badge>For you</Badge>
                  )
                ) : null}
                <Badge>{trainingCategoryLabel(item.category)}</Badge>
                {item.quizQuestions > 0 ? (
                  <Badge variant="outline">Quiz · {item.quizQuestions}</Badge>
                ) : null}
                {item.completedAt ? <Badge variant="success">Done</Badge> : null}
              </div>

              <Link href={`${basePath}/${item.id}`} className="mt-3 font-semibold hover:underline">
                {item.title}
              </Link>
              {item.description ? (
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : (
                <span className="flex-1" />
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {item.ownerType !== 'GENERAL' ? <span>{item.author.name}</span> : null}
                {item.durationMinutes ? <span>{item.durationMinutes} min</span> : null}
                {item.difficulty ? <span>Level {item.difficulty}/5</span> : null}
              </div>

              {renderActions ? <div className="mt-3">{renderActions(item)}</div> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
