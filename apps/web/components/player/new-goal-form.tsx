'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ifpc/ui';
import { createOwnGoalAction } from '@/app/actions/player';

/**
 * Formulario para que el jugador añada **su propia** meta de desarrollo. Las
 * metas que asigna un entrenador llegan por otra vía y no se tocan aquí.
 */
export function NewGoalForm() {
  const [state, formAction, pending] = useActionState(createOwnGoalAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        name="title"
        label="New goal"
        placeholder="E.g. Improve my weak foot"
        maxLength={120}
        required
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="dueDate" type="date" label="Target date" className="sm:w-44" />
        <Input
          name="description"
          label="How will you measure it? (optional)"
          maxLength={500}
          className="flex-1"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-brand">{state.success}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Adding…' : 'Add goal'}
      </Button>
    </form>
  );
}
