'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { createMeetingAction } from '@/app/actions/meetings';

const DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
];

export function MeetingForm() {
  const [state, formAction, pending] = useActionState(createMeetingAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="title" label="What is it?" placeholder="Meeting with the coach" required />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="startsAt" type="datetime-local" label="Date & time" required />
        <Select name="durationMinutes" label="Duration" options={DURATIONS} defaultValue="30" />
      </div>
      <Input name="withWhom" label="With" placeholder="Name or team" />
      <Input name="notes" label="Notes (optional)" placeholder="Agenda or location" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Add to calendar'}
      </Button>
    </form>
  );
}
