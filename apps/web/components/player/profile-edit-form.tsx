'use client';

import { useActionState } from 'react';
import { updatePlayerProfileAction } from '@/app/actions/player';
import { Button, Input, Select } from '@ifpc/ui';
import { COMPETITION_LEVEL_LABELS, COUNTRIES, FOOT_LABELS, POSITION_LABELS } from '@ifpc/config';
import type { Player } from '@ifpc/types';

export function ProfileEditForm({ player }: { player: Player }) {
  const [state, formAction, pending] = useActionState(updatePlayerProfileAction, {});

  const positionOptions = Object.entries(POSITION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const nationalityOptions = COUNTRIES.map((country) => ({ value: country, label: country }));
  const footOptions = Object.entries(FOOT_LABELS).map(([value, label]) => ({ value, label }));
  const competitionOptions = Object.entries(COMPETITION_LEVEL_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input name="firstName" label="Nombre" defaultValue={player.firstName} required />
        <Input name="lastName" label="Apellidos" defaultValue={player.lastName} required />
      </div>
      <Input
        name="dateOfBirth"
        type="date"
        label="Fecha de nacimiento"
        defaultValue={player.dateOfBirth ? player.dateOfBirth.toISOString().split('T')[0] : ''}
      />
      <Select
        name="nationality"
        label="Nacionalidad"
        options={nationalityOptions}
        defaultValue={player.nationality ?? ''}
        placeholder="Selecciona…"
      />
      <Select
        name="position"
        label="Posición"
        options={positionOptions}
        defaultValue={player.position ?? ''}
        placeholder="Selecciona…"
      />
      <Select
        name="foot"
        label="Pierna hábil"
        options={footOptions}
        defaultValue={player.foot ?? ''}
        placeholder="Selecciona…"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input name="heightCm" type="number" label="Altura (cm)" defaultValue={player.heightCm ?? ''} />
        <Input name="weightKg" type="number" label="Peso (kg)" defaultValue={player.weightKg ?? ''} />
      </div>
      <Select
        name="competitionLevel"
        label="Nivel competitivo"
        options={competitionOptions}
        defaultValue={player.competitionLevel ?? ''}
        placeholder="Selecciona…"
      />
      <Input name="clubName" label="Club actual" defaultValue={player.clubName ?? ''} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Biografía
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={player.bio ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
