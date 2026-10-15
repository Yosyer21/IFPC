'use client';

import { useActionState } from 'react';
import { updatePlayerStatusAction } from '@/app/actions/player';
import { Button } from '@ifpc/ui';

export function StatusToggle({
  status,
  size = 'md',
  fullWidth = false,
}: {
  status: string;
  size?: 'sm' | 'md';
  /** Ocupa todo el ancho de su contenedor (barra de acciones del móvil). */
  fullWidth?: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePlayerStatusAction, {});
  const available = status === 'AVAILABLE';
  const nextStatus = available ? 'INACTIVE' : 'AVAILABLE';

  return (
    <form
      action={formAction}
      className={`flex flex-col gap-1 ${fullWidth ? 'w-full items-stretch' : 'items-end'}`}
    >
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <input type="hidden" name="status" value={nextStatus} />
      <Button
        type="submit"
        variant={available ? 'outline' : 'primary'}
        size={size}
        className={fullWidth ? 'w-full' : ''}
        disabled={pending}
      >
        {pending ? 'Saving…' : available ? 'Mark as unavailable' : 'Mark as available'}
      </Button>
    </form>
  );
}
