'use client';

import { useActionState } from 'react';
import { createRequirementAction } from '@/app/actions/club';
import { Button, Input } from '@future-buller/ui';

export function CreateRequirementForm() {
  const [state, formAction, pending] = useActionState(createRequirementAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="title" label="Título" placeholder="Ej: Delantero Sub-17" required />
      <Input name="position" label="Posición" placeholder="DEL / MED / DEF…" />
      <div className="grid grid-cols-2 gap-3">
        <Input name="ageMin" type="number" label="Edad mínima" />
        <Input name="ageMax" type="number" label="Edad máxima" />
      </div>
      <Input name="level" label="Nivel" placeholder="regional / nacional…" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear requisito'}
      </Button>
    </form>
  );
}
