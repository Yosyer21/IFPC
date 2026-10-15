'use client';

import { useActionState, useState } from 'react';
import { completeSignupAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';
import { SIGNUP_ROLE_OPTIONS, type SignupRole } from '@ifpc/config';

/**
 * Último paso del alta con Google: elegir tipo de cuenta. Solo se ofrecen los
 * tipos que se pueden crear (jugador, entrenador y club) — el servidor lo vuelve
 * a validar.
 */
export function CompleteSignupForm({ defaultRole }: { defaultRole?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    completeSignupAction,
    {}
  );
  const [role, setRole] = useState<SignupRole>(
    SIGNUP_ROLE_OPTIONS.some((option) => option.value === defaultRole)
      ? (defaultRole as SignupRole)
      : 'PLAYER'
  );
  const needsCountry = role === 'CLUB';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Account type</label>
        <div className="grid grid-cols-1 gap-2">
          {SIGNUP_ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm ${
                role === option.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="accent-primary"
              />
              <span className="font-medium">{option.label}</span>
              <span className="text-muted-foreground">· {option.description}</span>
            </label>
          ))}
        </div>
      </div>

      {needsCountry ? <Input name="country" label="Country" placeholder="Spain" required /> : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create my account'}
      </Button>
    </form>
  );
}
