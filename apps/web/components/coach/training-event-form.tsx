'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { createTrainingEventAction } from '@/app/actions/team';

const DURATIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
  { value: '120', label: '120 min' },
];

export function TrainingEventForm() {
  const [state, formAction, pending] = useActionState(createTrainingEventAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="title" label="Session title" placeholder="U16 Girls — pressing" required />
      <Input name="startsAt" type="datetime-local" label="Date & time" required />
      <Select name="durationMinutes" label="Duration" options={DURATIONS} defaultValue="60" />
      <Input name="location" label="Location" placeholder="Main pitch" />
      <Input name="notes" label="Notes (optional)" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Add training'}
      </Button>
    </form>
  );
}
