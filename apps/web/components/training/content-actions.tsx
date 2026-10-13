import {
  deleteTrainingContentAction,
  toggleTrainingProgressAction,
} from '@/app/actions/training';
import { Button } from '@ifpc/ui';

/** Borra contenido del propio coach o club (el servidor comprueba la autoría). */
export function DeleteTrainingContentButton({ contentId }: { contentId: string }) {
  return (
    <form action={deleteTrainingContentAction}>
      <input type="hidden" name="contentId" value={contentId} />
      <button type="submit" className="text-xs text-muted-foreground hover:underline">
        Delete
      </button>
    </form>
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
