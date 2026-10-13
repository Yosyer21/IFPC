'use client';

import { useActionState } from 'react';
import { createTrainingContentAction, updateTrainingContentAction } from '@/app/actions/training';
import { Button, Input, Select } from '@ifpc/ui';
import {
  TRAINING_AUTHOR_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_KINDS,
  TRAINING_KIND_LABELS,
} from '@ifpc/config';

/** Valores con los que se rellena el formulario en modo edición. */
export interface TrainingContentFormValues {
  id: string;
  kind: string;
  category: string;
  title: string;
  description: string | null;
  content: string | null;
  outcomes: string[];
  videoUrl: string | null;
  durationMinutes: number | null;
  difficulty: number | null;
}

export interface TrainingContentFormProps {
  /** Tipo preseleccionado al publicar (la pestaña desde la que se abre). */
  defaultKind?: 'COURSE' | 'EXERCISE';
  /** Si viene, edita ese contenido en vez de crear uno nuevo. */
  content?: TrainingContentFormValues;
  /** Categorías elegibles (por defecto, las de coach/club). */
  categories?: readonly string[];
}

/**
 * Formulario de autoría del Football Center: sirve para **crear** y para
 * **editar**. El autor y el origen siempre los fija el servidor desde la sesión.
 */
export function TrainingContentForm({
  defaultKind = 'EXERCISE',
  content,
  categories = TRAINING_AUTHOR_CATEGORIES,
}: TrainingContentFormProps) {
  const editing = Boolean(content);
  const [state, formAction, pending] = useActionState(
    editing ? updateTrainingContentAction : createTrainingContentAction,
    {}
  );

  const kindOptions = TRAINING_KINDS.map((kind) => ({
    value: kind,
    label: TRAINING_KIND_LABELS[kind],
  }));
  const categoryOptions = categories.map((category) => ({
    value: category,
    label: TRAINING_CATEGORY_LABELS[category] ?? category,
  }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {content ? <input type="hidden" name="contentId" value={content.id} /> : null}
      {content ? (
        <Select name="kind" label="Type" options={kindOptions} defaultValue={content.kind} />
      ) : (
        // Al crear desde una pestaña el tipo lo fija la pestaña (cursos o
        // ejercicios): se manda como campo oculto y así no hay ambigüedad.
        <input type="hidden" name="kind" value={defaultKind} />
      )}
      <Select
        name="category"
        label="Category"
        options={categoryOptions}
        defaultValue={content?.category ?? categoryOptions[0]?.value}
      />
      <Input
        name="title"
        label="Title"
        required
        maxLength={140}
        defaultValue={content?.title ?? ''}
      />
      <Input
        name="description"
        label="Short description"
        maxLength={600}
        defaultValue={content?.description ?? ''}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Content or instructions
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          placeholder="Steps, series, repetitions, coaching points…"
          defaultValue={content?.content ?? ''}
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
          defaultValue={content?.outcomes.join('\n') ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="durationMinutes"
          type="number"
          min={1}
          max={600}
          label="Duration (minutes)"
          defaultValue={content?.durationMinutes ?? ''}
        />
        <Input
          name="difficulty"
          type="number"
          min={1}
          max={5}
          label="Level (1-5)"
          defaultValue={content?.difficulty ?? ''}
        />
      </div>
      <Input
        name="videoUrl"
        label="Video URL"
        placeholder="https://… (or upload a file below)"
        defaultValue={content?.videoUrl ?? ''}
      />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
      </Button>
    </form>
  );
}
