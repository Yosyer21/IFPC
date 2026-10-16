'use client';

import { useActionState, useState } from 'react';
import { registerAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';
import { SIGNUP_ROLE_OPTIONS, type SignupRole } from '@ifpc/config';
import { GoogleButton } from './google-button';
import { RoleChoiceCards } from './role-choice-cards';

export function RegisterForm({
  initialRole,
  googleEnabled = false,
}: {
  initialRole?: string;
  googleEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, {});
  const [role, setRole] = useState<SignupRole>(
    SIGNUP_ROLE_OPTIONS.some((option) => option.value === initialRole)
      ? (initialRole as SignupRole)
      : 'PLAYER'
  );
  // De momento solo se pueden crear cuentas de jugador, entrenador y club.
  const needsCountry = role === 'CLUB';

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton />

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or sign up with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <RoleChoiceCards value={role} onChange={setRole} />

        <Input name="name" label="Full name" placeholder="Your name" required />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@email.com"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Minimum 8 characters"
          minLength={8}
          required
          autoComplete="new-password"
        />

        {needsCountry ? (
          <div className="grid grid-cols-2 gap-3">
            <Input name="country" label="Country" placeholder="Spain" required />
            <Input name="city" label="City" placeholder="Madrid" />
          </div>
        ) : null}

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
