'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { createClientPlanAction } from '@/app/actions/health-agent';

const KINDS = [
  { value: 'NUTRITION', label: 'Nutrition' },
  { value: 'PSYCHOLOGY', label: 'Sport psychology' },
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy' },
  { value: 'ONE_TO_ONE', label: 'One-to-one' },
];

export function ClientPlanForm({ clients }: { clients: { value: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(createClientPlanAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Select
        name="playerId"
        label="Client"
        options={clients}
        placeholder={clients.length ? 'Select…' : 'No clients yet'}
        required
      />
      <Select name="kind" label="Plan type" options={KINDS} defaultValue="NUTRITION" />
      <Input name="title" label="Plan title" placeholder="Match-day fuel plan" required />
      <Input
        name="totalSteps"
        type="number"
        min={1}
        max={52}
        label="Total steps"
        defaultValue={4}
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending || clients.length === 0}>
        {pending ? 'Creating…' : 'Create plan'}
      </Button>
    </form>
  );
}
