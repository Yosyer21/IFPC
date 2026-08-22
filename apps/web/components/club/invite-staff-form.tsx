'use client';

import { useActionState } from 'react';
import { inviteStaffAction } from '@/app/actions/club';
import { Button, Input, Select } from '@ifpc/ui';

const ROLES = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'COACH', label: 'Entrenador' },
  { value: 'SCOUT', label: 'Ojeador' },
];

export function InviteStaffForm() {
  const [state, formAction, pending] = useActionState(inviteStaffAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input
        name="email"
        type="email"
        label="Email del miembro"
        placeholder="miembro@email.com"
        required
      />
      <Select name="role" label="Rol" options={ROLES} defaultValue="STAFF" />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Inviting…' : 'Invitar'}
      </Button>
    </form>
  );
}
