'use client';

import { useActionState } from 'react';
import { createScoutingReportAction } from '@/app/actions/scout';
import { Button, Input, Select } from '@future-buller/ui';

export function CreateScoutingReportForm({
  players,
}: {
  players: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createScoutingReportAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Select name="playerId" label="Jugador" options={players} placeholder="Selecciona…" required />
      <Input name="rating" type="number" label="Valoración (1-10)" min={1} max={10} required />
      <Input name="strengths" label="Fortalezas" placeholder="Control, visión…" />
      <Input name="weaknesses" label="A mejorar" placeholder="Juego aéreo…" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas
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
        {pending ? 'Guardando…' : 'Crear informe'}
      </Button>
    </form>
  );
}
