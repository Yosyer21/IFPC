'use client';

import { useActionState } from 'react';
import { createSubmissionAction } from '@/app/actions/agent';
import { Button, Select } from '@ifpc/ui';

export function CreateSubmissionForm({
  players,
  clubs,
}: {
  players: { value: string; label: string }[];
  clubs: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSubmissionAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Select name="playerId" label="Jugador" options={players} placeholder="Selecciona…" required />
      <Select name="clubId" label="Club destino" options={clubs} placeholder="Selecciona…" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Create submission'}
      </Button>
    </form>
  );
}
