'use client';

import { useActionState } from 'react';
import { createOpportunityAction } from '@/app/actions/club';
import { Button, Input, Select } from '@ifpc/ui';

const TYPES = [
  { value: 'TRIAL', label: 'Prueba' },
  { value: 'SCOUTING', label: 'Scouting' },
  { value: 'CONTRACT', label: 'Contrato' },
  { value: 'SCHOLARSHIP', label: 'Beca' },
  { value: 'ACADEMY', label: 'Academia' },
];

export function CreateOpportunityForm() {
  const [state, formAction, pending] = useActionState(createOpportunityAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="title" label="Title" placeholder="Ej: Prueba para juvenil Sub-17" required />
      <Select name="type" label="Tipo" options={TYPES} defaultValue="TRIAL" required />
      <Input name="position" label="Position" placeholder="DEL / MED / DEF…" />
      <div className="grid grid-cols-2 gap-3">
        <Input name="ageMin" type="number" label="Minimum age" />
        <Input name="ageMax" type="number" label="Maximum age" />
      </div>
      <Input name="location" label="Location" placeholder="Madrid" />
      <Input name="closesAt" type="date" label="Fecha de cierre" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Publicar oportunidad'}
      </Button>
    </form>
  );
}
