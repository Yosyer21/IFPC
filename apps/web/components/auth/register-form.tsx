'use client';

import { useActionState, useState } from 'react';
import { registerAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';
import type { Role } from '@ifpc/types';

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'PLAYER', label: 'Player', description: 'I am a footballer' },
  { value: 'PARENT', label: 'Parent', description: 'Father, mother or guardian' },
  { value: 'COACH', label: 'Coach', description: 'I coach players' },
  { value: 'AGENT', label: 'Agent', description: 'I represent players' },
  { value: 'CLUB', label: 'Club', description: 'I represent a club' },
];

export function RegisterForm({ initialRole }: { initialRole?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, {});
  const [role, setRole] = useState<Role>(
    ROLES.some((item) => item.value === initialRole) ? (initialRole as Role) : 'PLAYER'
  );
  const isClub = role === 'CLUB';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Account type</label>
        <div className="grid grid-cols-1 gap-2">
          {ROLES.map((item) => (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm ${
                role === item.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={item.value}
                checked={role === item.value}
                onChange={() => setRole(item.value)}
                className="accent-primary"
              />
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">· {item.description}</span>
            </label>
          ))}
        </div>
      </div>

      <Input name="name" label="Full name" placeholder="Your name" required />
      <Input name="email" type="email" label="Email" placeholder="you@email.com" required autoComplete="email" />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="Minimum 8 characters"
        minLength={8}
        required
        autoComplete="new-password"
      />

      {isClub ? (
        <div className="grid grid-cols-2 gap-3">
          <Input name="country" label="Country" placeholder="Spain" required />
          <Input name="city" label="City" placeholder="Madrid" />
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
