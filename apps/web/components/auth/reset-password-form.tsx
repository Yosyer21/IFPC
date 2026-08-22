'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetPasswordAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Input
        name="password"
        type="password"
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        required
        autoComplete="new-password"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Actualizar contraseña'}
      </Button>
    </form>
  );
}
