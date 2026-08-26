'use client';

import { useActionState } from 'react';
import { addPlayerAction } from '@/app/actions/agent';
import { Button, Input } from '@ifpc/ui';

export function AddPlayerForm() {
  const [state, formAction, pending] = useActionState(addPlayerAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input
        name="email"
        type="email"
        label="Email del jugador"
        placeholder="jugador@email.com"
        required
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Buscando…' : 'Add player'}
      </Button>
    </form>
  );
}
