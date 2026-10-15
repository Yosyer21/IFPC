'use client';

import { useActionState } from 'react';
import { changeEmailAction } from '@/app/actions/account';
import { Button, Input } from '@ifpc/ui';

/**
 * Cambia el email de la cuenta. La contraseña se pide solo cuando la cuenta tiene
 * una: cambiar el correo es el primer paso para llevarse una cuenta ajena.
 */
export function EmailForm({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(changeEmailAction, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <Input
        name="email"
        type="email"
        label="New email"
        defaultValue={email}
        autoComplete="email"
        required
      />
      {hasPassword ? (
        <Input
          name="currentPassword"
          type="password"
          label="Confirm your password"
          autoComplete="current-password"
          required
        />
      ) : null}
      <p className="text-xs text-muted-foreground">
        We will send a verification link to the new address, and your email will stay unverified
        until you open it. If you make a mistake you can change it again from here.
      </p>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-brand">{state.success}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Sending…' : 'Change email'}
      </Button>
    </form>
  );
}
