'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ifpc/ui';
import { createMatchAction } from '@/app/actions/team';

export function MatchForm() {
  const [state, formAction, pending] = useActionState(createMatchAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="opponent" label="Opponent" placeholder="Riverside FC" required />
      <Input name="startsAt" type="datetime-local" label="Kick-off" required />
      <Input name="venue" label="Venue" placeholder="Home pitch" />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="home"
          defaultChecked
          className="h-4 w-4 rounded border-border bg-muted accent-brand"
        />
        Home match
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Input name="ourScore" type="number" min={0} label="Our score (optional)" />
        <Input name="opponentScore" type="number" min={0} label="Opponent (optional)" />
      </div>
      <Input name="notes" label="Notes (optional)" placeholder="Meeting point, kit…" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Add match'}
      </Button>
    </form>
  );
}
