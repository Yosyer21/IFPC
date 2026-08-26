'use client';

import { useActionState } from 'react';
import { createEvaluationAction } from '@/app/actions/coach';
import { Button, Input, Select } from '@ifpc/ui';

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technique' },
  { value: 'physical', label: 'Physical' },
  { value: 'tactical', label: 'Tactics' },
  { value: 'psychological', label: 'Psychological' },
];

export function CreateEvaluationForm({ playerId }: { playerId: string }) {
  const [state, formAction, pending] = useActionState(createEvaluationAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="playerId" value={playerId} />
      <Select name="category" label="Category" options={CATEGORY_OPTIONS} defaultValue="technical" />
      <Input name="score" type="number" label="Score (1-10)" min={1} max={10} required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Strengths, areas for improvement, comments…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Register assessment'}
      </Button>
    </form>
  );
}
