'use client';

import { useActionState } from 'react';
import { resendVerificationEmailAction, type ActionState } from '@/app/actions/auth';

export function VerifyEmailBanner() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resendVerificationEmailAction,
    {}
  );

  return (
    <div className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Tu email aún no está verificado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Verifica tu dirección de email para desbloquear todas las funciones de la plataforma.
          </p>
        </div>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'Enviando…' : 'Reenviar enlace'}
          </button>
        </form>
      </div>
      {state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="mt-2 break-all text-sm text-emerald-600">{state.success}</p>
      ) : null}
    </div>
  );
}
