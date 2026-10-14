'use client';

import { useActionState } from 'react';
import {
  createTrainingSessionAction,
  updateTrainingSessionAction,
} from '@/app/actions/training-sessions';
import { Button, Input, Select } from '@ifpc/ui';
import { TRAINING_WEEKDAY_OPTIONS } from '@ifpc/config';
import { VisibilityFields, defaultVisibility } from '@/components/training/visibility-fields';
import { AudienceFields } from '@/components/training/audience-fields';

/** Valor del desplegable de día para «sin día fijo». */
export const NO_WEEKDAY = 'none';

/** Valores con los que se rellena el formulario en modo edición. */
export interface TrainingSessionFormValues {
  id: string;
  title: string;
  description: string | null;
  weekday: number | null;
  status: string;
  publishAt: Date | null;
  /** Destinatarios: `AUDIENCE` o `SELECTED`. */
  scope: string;
  /** Jugadores elegidos cuando `scope = SELECTED`. */
  targetPlayerIds: string[];
}

export interface TrainingSessionFormProps {
  /** Si viene, edita esa sesión en vez de crear una nueva. */
  session?: TrainingSessionFormValues;
  /** Jugadores del autor, para poder dirigir la sesión a algunos. */
  players?: { playerId: string; name: string }[];
}

/**
 * Formulario de una sesión (plan): sirve para **crear** y para **editar**. El
 * autor y el origen los fija el servidor desde la sesión, nunca el formulario.
 */
export function TrainingSessionForm({ session, players = [] }: TrainingSessionFormProps) {
  const editing = Boolean(session);
  const [state, formAction, pending] = useActionState(
    editing ? updateTrainingSessionAction : createTrainingSessionAction,
    {}
  );

  const weekdayOptions = [{ value: NO_WEEKDAY, label: 'Any day' }, ...TRAINING_WEEKDAY_OPTIONS];
  const weekdayDefault =
    session?.weekday === null || session?.weekday === undefined
      ? NO_WEEKDAY
      : String(session.weekday);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {session ? <input type="hidden" name="sessionId" value={session.id} /> : null}
      <Input
        name="title"
        label="Session title"
        required
        maxLength={140}
        defaultValue={session?.title ?? ''}
      />
      <Input
        name="description"
        label="What is this session about?"
        maxLength={600}
        defaultValue={session?.description ?? ''}
      />
      <Select
        name="weekday"
        label="Suggested day"
        options={weekdayOptions}
        defaultValue={weekdayDefault}
      />
      <AudienceFields
        players={players}
        defaultScope={session?.scope ?? 'AUDIENCE'}
        selectedPlayerIds={session?.targetPlayerIds ?? []}
      />
      <VisibilityFields
        defaultValue={defaultVisibility(session)}
        publishAt={session?.publishAt ?? null}
        hint="A session only notifies your players when it already has exercises in it."
      />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : editing ? 'Save changes' : 'Create session'}
      </Button>
    </form>
  );
}
