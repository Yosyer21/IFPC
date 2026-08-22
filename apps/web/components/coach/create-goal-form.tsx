'use client';

import { useActionState } from 'react';
import { createGoalAction } from '@/app/actions/coach';
import { Button, Input } from '@ifpc/ui';

export function CreateGoalForm({ playerId }: { playerId: string }) {
  const [state, formAction, pending] = useActionState(createGoalAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="playerId" value={playerId} />
      <Input name="title" label="Título del objetivo" placeholder="Ej: Mejorar el juego de espaldas" required />
      <Input name="dueDate" type="date" label="Fecha límite" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Detalle del objetivo y cómo medirlo…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Crear objetivo'}
      </Button>
    </form>
  );
}
