'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { COUNTRIES } from '@ifpc/config';
import { createClubProfileAction } from '@/app/actions/club';

/**
 * Formulario mínimo para crear el perfil de club cuando la cuenta tiene el rol
 * CLUB pero aún no existe su fila `Club` (evita el 404 del área del club).
 */
export function QuickClubProfileForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState(createClubProfileAction, {});
  const countryOptions = COUNTRIES.map((country) => ({ value: country, label: country }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="name" label="Club name" defaultValue={defaultName} required />
      <Select
        name="country"
        label="Country"
        options={countryOptions}
        placeholder="Select…"
        required
      />
      <Input name="city" label="City" placeholder="Valencia" />
      <Input name="league" label="League or division" placeholder="Liga F" />
      <Input name="foundedYear" type="number" label="Founded in" placeholder="1998" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          About the club
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Project, methodology, facilities and what the club offers."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {defaultEmail ? (
        <p className="text-xs text-muted-foreground">Account email: {defaultEmail}</p>
      ) : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create club profile'}
      </Button>
    </form>
  );
}
