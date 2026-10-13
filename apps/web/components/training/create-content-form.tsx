'use client';

import { useActionState } from 'react';
import { createTrainingContentAction } from '@/app/actions/training';
import { Button, Input, Select } from '@ifpc/ui';
import {
  TRAINING_AUTHOR_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_KINDS,
  TRAINING_KIND_LABELS,
} from '@ifpc/config';

export interface CreateTrainingContentFormProps {
  /** Tipo preseleccionado (la pestaña desde la que se abre el formulario). */
  defaultKind?: 'COURSE' | 'EXERCISE';
}

/**
 * Formulario con el que un coach o un club publica un curso o un ejercicio en el
 * Football Center. El autor y el origen los fija el servidor desde la sesión.
 */
export function CreateTrainingContentForm({
  defaultKind = 'EXERCISE',
}: CreateTrainingContentFormProps) {
  const [state, formAction, pending] = useActionState(createTrainingContentAction, {});

  const kindOptions = TRAINING_KINDS.map((kind) => ({
    value: kind,
    label: TRAINING_KIND_LABELS[kind],
  }));
  const categoryOptions = TRAINING_AUTHOR_CATEGORIES.map((category) => ({
    value: category,
    label: TRAINING_CATEGORY_LABELS[category] ?? category,
  }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Select name="kind" label="Type" options={kindOptions} defaultValue={defaultKind} />
      <Select
        name="category"
        label="Category"
        options={categoryOptions}
        defaultValue="technical"
      />
      <Input name="title" label="Title" required maxLength={140} />
      <Input name="description" label="Short description" maxLength={600} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Content or instructions
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          placeholder="Steps, series, repetitions, coaching points…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="outcomes" className="text-sm font-medium">
          Key points <span className="text-muted-foreground">(one per line)</span>
        </label>
        <textarea
          id="outcomes"
          name="outcomes"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input name="durationMinutes" type="number" min={1} max={600} label="Duration (minutes)" />
        <Input name="difficulty" type="number" min={1} max={5} label="Level (1-5)" />
      </div>
      <Input name="videoUrl" label="Video URL" placeholder="https://…" />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Publishing…' : 'Publish'}
      </Button>
    </form>
  );
}
