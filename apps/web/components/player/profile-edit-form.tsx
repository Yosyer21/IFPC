'use client';

import { useActionState } from 'react';
import { updatePlayerProfileAction } from '@/app/actions/player';
import { Button, Input, Select } from '@ifpc/ui';
import {
  COMPETITION_LEVEL_LABELS,
  COUNTRIES,
  FOOT_LABELS,
  POSITION_LABELS,
  PROFILE_ACCENTS,
  PROFILE_ACCENT_PALETTE,
  PROFILE_HEADLINE_MAX,
  PROFILE_LOCATION_MAX,
  PROFILE_OPEN_TO,
  PROFILE_OPEN_TO_LABELS,
  PROFILE_OPEN_TO_MAX,
  resolveProfileAccent,
} from '@ifpc/config';
import type { Player } from '@ifpc/types';

export function ProfileEditForm({ player }: { player: Player }) {
  const [state, formAction, pending] = useActionState(updatePlayerProfileAction, {});
  const currentAccent = resolveProfileAccent(player.accentColor);

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
        label="Position"
        options={positionOptions}
        defaultValue={player.position ?? ''}
        placeholder="Selecciona…"
      />
      <Select
        name="foot"
        label="Preferred foot"
        options={footOptions}
        defaultValue={player.foot ?? ''}
        placeholder="Selecciona…"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="heightCm"
          type="number"
          label="Altura (cm)"
          defaultValue={player.heightCm ?? ''}
        />
        <Input
          name="weightKg"
          type="number"
          label="Peso (kg)"
          defaultValue={player.weightKg ?? ''}
        />
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
          Biography
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={player.bio ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {/* Personalización del perfil: titular, ubicación, señales y acento. */}
      <fieldset
        id="personalizacion"
        className="flex flex-col gap-4 rounded-xl border border-border/60 p-4"
      >
        <legend className="px-1 text-sm font-semibold">Personalización del perfil</legend>

        <Input
          name="headline"
          label="Titular"
          maxLength={PROFILE_HEADLINE_MAX}
          placeholder="Ej.: Extremo zurdo, rápido al espacio"
          defaultValue={player.headline ?? ''}
        />
        <Input
          name="location"
          label="Ubicación"
          maxLength={PROFILE_LOCATION_MAX}
          placeholder="Ej.: Valencia, España"
          defaultValue={player.location ?? ''}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Abierto a <span className="text-muted-foreground">(máx. {PROFILE_OPEN_TO_MAX})</span>
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PROFILE_OPEN_TO.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="openTo"
                  value={value}
                  defaultChecked={player.openTo?.includes(value) ?? false}
                  className="h-4 w-4 rounded border-border bg-white/5 accent-emerald-400"
                />
                {PROFILE_OPEN_TO_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Color del perfil</legend>
          <div className="flex flex-wrap gap-2">
            {PROFILE_ACCENTS.map((accent) => {
              const { label, hex } = PROFILE_ACCENT_PALETTE[accent];
              return (
                <label key={accent} className="cursor-pointer" title={label}>
                  <input
                    type="radio"
                    name="accentColor"
                    value={accent}
                    defaultChecked={accent === currentAccent}
                    className="peer sr-only"
                  />
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition peer-checked:ring-2 peer-checked:ring-white/70"
                    style={{ backgroundColor: hex, boxShadow: `0 0 24px -8px ${hex}` }}
                  >
                    <span className="sr-only">{label}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Se aplica al anillo del avatar, al titular y a los chips de tu perfil.
          </p>
        </fieldset>
      </fieldset>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
