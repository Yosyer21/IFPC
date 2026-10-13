import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { trainingCategoryLabel, trainingWeekdayLabel } from '@ifpc/config';
import { trainingPublishState } from '@/lib/training';
import type { TrainingSessionView } from '@/lib/training-sessions';

export interface TrainingSessionCardProps {
  session: TrainingSessionView;
  /** Ruta del detalle de cada ejercicio (la del jugador por defecto). */
  contentBasePath?: string;
  /** Si viene, el título enlaza al detalle de la sesión (vista del jugador). */
  detailHref?: string;
  /** Marca borrador o programado (vista del autor). */
  showPublishState?: boolean;
  /** Barra y contador de ejercicios completados (vista del jugador). */
  showProgress?: boolean;
  /** Acciones del autor (editar, publicar, borrar). */
  renderActions?: (session: TrainingSessionView) => ReactNode;
}

/**
 * Tarjeta de una sesión o plan: los ejercicios en orden, su carga total y, para el
 * jugador, cuántos lleva hechos. El autor ve el estado (borrador/programado).
 */
export function TrainingSessionCard({
  session,
  contentBasePath = '/dashboard/player/training',
  detailHref,
  showPublishState = false,
  showProgress = false,
  renderActions,
}: TrainingSessionCardProps) {
  const state = showPublishState ? trainingPublishState(session) : null;
  const weekday = trainingWeekdayLabel(session.weekday);
  const total = session.items.length;

  return (
    <Card className="card-hover">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {state === 'DRAFT' ? <Badge variant="warning">Draft</Badge> : null}
          {state === 'SCHEDULED' ? <Badge variant="outline">Scheduled</Badge> : null}
          {weekday ? <Badge variant="default">{weekday}</Badge> : null}
          <Badge variant="outline">
            {total} {total === 1 ? 'exercise' : 'exercises'}
          </Badge>
          {session.totalMinutes > 0 ? (
            <Badge variant="outline">{session.totalMinutes} min</Badge>
          ) : null}
        </div>

        <div>
          {detailHref ? (
            <Link href={detailHref} className="font-semibold hover:underline">
              {session.title}
            </Link>
          ) : (
            <p className="font-semibold">{session.title}</p>
          )}
          {session.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{session.description}</p>
          ) : null}
        </div>

        {showProgress && total > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              {session.completedCount} of {total} completed
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.round((session.completedCount / total) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {total > 0 ? (
          <ol className="flex flex-col gap-1.5 text-sm">
            {session.items.map((item, index) => (
              <li key={item.id} className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                <Link href={`${contentBasePath}/${item.contentId}`} className="hover:underline">
                  {item.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {[
                    trainingCategoryLabel(item.category),
                    item.durationMinutes ? `${item.durationMinutes} min` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {item.completed ? <Badge variant="success">Done</Badge> : null}
              </li>
            ))}
          </ol>
        ) : null}

        {renderActions ? <div className="mt-1">{renderActions(session)}</div> : null}
      </CardContent>
    </Card>
  );
}
