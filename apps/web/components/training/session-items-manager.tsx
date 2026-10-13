import {
  addTrainingSessionItemAction,
  moveTrainingSessionItemAction,
  removeTrainingSessionItemAction,
} from '@/app/actions/training-sessions';
import { Select } from '@ifpc/ui';
import { trainingCategoryLabel } from '@ifpc/config';
import { trainingPublishState, type TrainingItem } from '@/lib/training';
import type { TrainingSessionView } from '@/lib/training-sessions';

export interface TrainingSessionItemsManagerProps {
  session: TrainingSessionView;
  /** Contenido propio que se puede añadir (sus ejercicios). */
  available: TrainingItem[];
}

/** Fila de la sesión: lo que se ve de cada ejercicio más sus acciones. */
function itemSubtitle(item: TrainingSessionView['items'][number]): string {
  return [
    trainingCategoryLabel(item.category),
    item.durationMinutes ? `${item.durationMinutes} min` : null,
    item.workload,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Acción de un solo botón (mover o quitar) sobre un ejercicio de la sesión. */
function ItemAction({
  itemId,
  action,
  label,
  extra,
  disabled,
}: {
  itemId: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  extra?: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={itemId} />
      {Object.entries(extra ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        {label}
      </button>
    </form>
  );
}

/**
 * Montaje de una sesión: añadir ejercicios propios, quitarlos y ordenarlos. El
 * servidor comprueba la propiedad de la sesión **y** del ejercicio.
 */
export function TrainingSessionItemsManager({
  session,
  available,
}: TrainingSessionItemsManagerProps) {
  const inSession = new Set(session.items.map((item) => item.contentId));
  // Solo ejercicios ya publicados: así el jugador nunca ve un enlace roto.
  const addable = available.filter(
    (item) =>
      item.kind === 'EXERCISE' &&
      trainingPublishState(item) === 'PUBLISHED' &&
      !inSession.has(item.id)
  );

  return (
    <div className="flex flex-col gap-4">
      {session.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No exercises yet: add the first one below and they will show up in order.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {session.items.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {index + 1}. {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{itemSubtitle(item)}</p>
              </div>
              <div className="flex items-center gap-2">
                <ItemAction
                  itemId={item.id}
                  action={moveTrainingSessionItemAction}
                  label="↑"
                  extra={{ direction: 'up' }}
                  disabled={index === 0}
                />
                <ItemAction
                  itemId={item.id}
                  action={moveTrainingSessionItemAction}
                  label="↓"
                  extra={{ direction: 'down' }}
                  disabled={index === session.items.length - 1}
                />
                <ItemAction
                  itemId={item.id}
                  action={removeTrainingSessionItemAction}
                  label="Remove"
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {addable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Every exercise you have published is already in this session. Publish a new exercise to
          add it here.
        </p>
      ) : (
        <form action={addTrainingSessionItemAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="sessionId" value={session.id} />
          <Select
            name="contentId"
            label="Add exercise"
            options={addable.map((item) => ({
              value: item.id,
              label: item.durationMinutes
                ? `${item.title} · ${item.durationMinutes} min`
                : item.title,
            }))}
          />
          <button
            type="submit"
            className="h-10 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-white/5"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
