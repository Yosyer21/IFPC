'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/app/actions/account';
import { Button, Input } from '@ifpc/ui';

/** Cambia la contraseña, o la crea si la cuenta todavía no tiene ninguna. */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {hasPassword ? (
        <Input
          name="currentPassword"
          type="password"
          label="Current password"
          autoComplete="current-password"
          required
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Your account does not have a password yet. Create one to be able to sign in with your
          email address.
        </p>
      )}
      <Input
        name="newPassword"
        type="password"
        label={hasPassword ? 'New password' : 'Password'}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Repeat the password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-brand">{state.success}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : hasPassword ? 'Change password' : 'Create password'}
      </Button>
    </form>
  );
}
