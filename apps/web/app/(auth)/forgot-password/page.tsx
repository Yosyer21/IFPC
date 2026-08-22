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
      <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Introduce tu email y te enviaremos un enlace para restablecerla.
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" placeholder="tu@email.com" required />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>
    </div>
  );
}
