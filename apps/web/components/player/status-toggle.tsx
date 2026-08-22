'use client';

import { useActionState } from 'react';
import { updatePlayerStatusAction } from '@/app/actions/player';
import { Button } from '@ifpc/ui';

export function StatusToggle({ status }: { status: string }) {
  const [state, formAction, pending] = useActionState(updatePlayerStatusAction, {});
  const available = status === 'AVAILABLE';
  const nextStatus = available ? 'INACTIVE' : 'AVAILABLE';

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <input type="hidden" name="status" value={nextStatus} />
      <Button type="submit" variant={available ? 'outline' : 'primary'} disabled={pending}>
        {pending ? 'Guardando…' : available ? 'Marcar como no disponible' : 'Marcar como disponible'}
      </Button>
    </form>
  );
}
