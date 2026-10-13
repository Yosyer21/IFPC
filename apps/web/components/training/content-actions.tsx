import Link from 'next/link';
import { deleteTrainingContentAction, toggleTrainingProgressAction } from '@/app/actions/training';
import { Button } from '@ifpc/ui';

/** Acciones del autor sobre su contenido: editar y borrar. */
export function TrainingContentActions({
  contentId,
  basePath,
}: {
  contentId: string;
  basePath: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`${basePath}/${contentId}/edit`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </Link>
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
