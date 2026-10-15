'use client';

import { useActionState } from 'react';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';
import { GoogleButton } from './google-button';

export function LoginForm({
  callbackUrl,
  googleEnabled = false,
}: {
  callbackUrl: string;
  googleEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled ? (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <a href="/forgot-password" className="text-muted-foreground hover:underline">
            Forgot your password?
          </a>
          <a href="/register" className="hover:underline">
            Create account
          </a>
        </div>
      </form>
    </div>
  );
}
