'use client';

import { useActionState } from 'react';
import { respondInquiryAction } from '@/app/actions/club';
import { Button } from '@future-buller/ui';

export function RespondInquiryForm({ inquiryId }: { inquiryId: string }) {
  const [state, formAction, pending] = useActionState(respondInquiryAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="response" className="text-sm font-medium">
          Respuesta
        </label>
        <textarea
          id="response"
          name="response"
          rows={5}
          required
          placeholder="Escribe tu respuesta…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar respuesta'}
      </Button>
    </form>
  );
}
