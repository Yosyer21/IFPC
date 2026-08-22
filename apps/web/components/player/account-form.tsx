'use client';

import { useActionState } from 'react';
import { updateAccountAction } from '@/app/actions/player';
import { Button, Input } from '@ifpc/ui';

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateAccountAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="name" label="Nombre completo" defaultValue={name} required />
      <Input name="email" label="Email" defaultValue={email} disabled />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
