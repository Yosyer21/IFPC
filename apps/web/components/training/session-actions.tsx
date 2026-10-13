import Link from 'next/link';
import {
  deleteTrainingSessionAction,
  publishTrainingSessionAction,
  unpublishTrainingSessionAction,
} from '@/app/actions/training-sessions';
import { trainingPublishState } from '@/lib/training';
import type { TrainingSessionView } from '@/lib/training-sessions';

/**
 * Acciones del autor sobre su sesión: editar (montarla), publicar o despublicar y
 * borrar. Como en el contenido, el servidor comprueba la propiedad.
 */
export function TrainingSessionActions({
  session,
  basePath,
}: {
  session: TrainingSessionView;
  basePath: string;
}) {
  const state = trainingPublishState(session);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`${basePath}/sessions/${session.id}/edit`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </Link>
      {state !== 'PUBLISHED' ? (
        <form action={publishTrainingSessionAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          <button type="submit" className="text-xs font-medium text-emerald-300 hover:underline">
            Publish now
          </button>
        </form>
      ) : null}
      {state === 'PUBLISHED' ? (
        <form action={unpublishTrainingSessionAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          <button type="submit" className="text-xs text-muted-foreground hover:underline">
            Unpublish
          </button>
        </form>
      ) : null}
      <form action={deleteTrainingSessionAction}>
        <input type="hidden" name="sessionId" value={session.id} />
        <button type="submit" className="text-xs text-muted-foreground hover:underline">
          Delete
        </button>
      </form>
    </div>
  );
}
