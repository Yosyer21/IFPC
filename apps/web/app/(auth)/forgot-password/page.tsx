'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Recover password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your email and we will send you a link to reset it.
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="you@email.com" required />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send link'}
        </Button>
      </form>
    </div>
  );
}
