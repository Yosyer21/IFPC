import Link from 'next/link';
import {
  deleteTrainingContentAction,
  publishTrainingContentAction,
  toggleTrainingProgressAction,
  unpublishTrainingContentAction,
} from '@/app/actions/training';
import { trainingPublishState, type TrainingItem } from '@/lib/training';
import { Button } from '@ifpc/ui';

/**
 * Acciones del autor sobre su contenido: editar, publicar o despublicar y borrar.
 * El estado decide qué atajos tienen sentido: «Publish now» para lo que aún no
 * ven los jugadores (borrador o programado) y «Unpublish» para lo publicado.
 */
export function TrainingContentActions({
  contentId,
  basePath,
  content,
}: {
  contentId: string;
  basePath: string;
  /** Estado del contenido: si no viene, solo se ofrecen editar y borrar. */
  content?: Pick<TrainingItem, 'status' | 'publishAt'>;
}) {
  const state = content ? trainingPublishState(content) : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`${basePath}/${contentId}/edit`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </Link>
      {state && state !== 'PUBLISHED' ? (
        <form action={publishTrainingContentAction}>
          <input type="hidden" name="contentId" value={contentId} />
          <button type="submit" className="text-xs font-medium text-emerald-300 hover:underline">
            Publish now
          </button>
        </form>
      ) : null}
      {state === 'PUBLISHED' ? (
        <form action={unpublishTrainingContentAction}>
          <input type="hidden" name="contentId" value={contentId} />
          <button type="submit" className="text-xs text-muted-foreground hover:underline">
            Unpublish
          </button>
        </form>
      ) : null}
      <form action={deleteTrainingContentAction}>
        <input type="hidden" name="contentId" value={contentId} />
        <button type="submit" className="text-xs text-muted-foreground hover:underline">
          Delete
        </button>
      </form>
    </div>
  );
}

/**
 * Marca un curso o ejercicio como completado (y lo desmarca si ya lo estaba).
 * El servidor valida que el contenido sea visible para ese jugador.
 */
export function CompleteContentButton({
  contentId,
  completed,
  redirectTo,
}: {
  contentId: string;
  completed: boolean;
  redirectTo: string;
}) {
  return (
    <form action={toggleTrainingProgressAction}>
      <input type="hidden" name="contentId" value={contentId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button type="submit" variant={completed ? 'outline' : 'primary'}>
        {completed ? 'Mark as pending' : 'Mark as completed'}
      </Button>
    </form>
  );
}
