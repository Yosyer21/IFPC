'use client';

import { useActionState } from 'react';
import { updateAccountAction } from '@/app/actions/player';
import { Button, Input } from '@ifpc/ui';

/** Nombre de la cuenta. Lo comparten los ajustes de cualquier rol. */
export function NameForm({ name, redirectTo }: { name: string; redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(updateAccountAction, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <Input name="name" label="Full name" defaultValue={name} autoComplete="name" required />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
