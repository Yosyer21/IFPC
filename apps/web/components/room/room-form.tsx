'use client';

import { useActionState } from 'react';
import { createTrainingRoomAction } from '@/app/actions/training-rooms';
import { Button, Input } from '@ifpc/ui';
import { AudienceFields } from '@/components/training/audience-fields';

/** Abrir una sala: título, cuándo y a quién se invita. */
export function TrainingRoomForm({
  players,
}: {
  players: { playerId: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTrainingRoomAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="title" label="Room title" required maxLength={140} placeholder="Session 3 review" />
      <Input
        name="description"
        label="What is it about?"
        maxLength={600}
        placeholder="15 minutes to go through the last match"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="startsAt" className="text-sm font-medium">
          Starts at <span className="text-muted-foreground">(leave empty to start now)</span>
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          The room opens 10 minutes before and you can join from the link.
        </p>
      </div>

      <AudienceFields players={players} defaultScope="SELECTED" selectedPlayerIds={[]} />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Opening…' : 'Open room'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Up to 4 people per room. Nobody is recorded and you can leave at any time.
      </p>
    </form>
  );
}
