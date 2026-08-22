'use client';

import { useActionState } from 'react';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        required
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Iniciando…' : 'Iniciar sesión'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <a href="/forgot-password" className="text-muted-foreground hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
        <a href="/register" className="hover:underline">
          Crear cuenta
        </a>
      </div>
    </form>
  );
}
