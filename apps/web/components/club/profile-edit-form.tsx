'use client';

import { useActionState } from 'react';
import { updateClubProfileAction } from '@/app/actions/club';
import { Button, Input, Select } from '@ifpc/ui';
import {
  CLUB_PROFILE_TAGS,
  CLUB_PROFILE_TAG_LABELS,
  CLUB_PROFILE_TAGS_MAX,
  COUNTRIES,
  LEAGUES,
  PROFILE_ACCENTS,
  PROFILE_ACCENT_PALETTE,
  PROFILE_HEADLINE_MAX,
  resolveProfileAccent,
} from '@ifpc/config';
import type { Club } from '@ifpc/types';

/** Edición del perfil público del club: datos, headline, chips y acento. */
export function ClubProfileEditForm({ club }: { club: Club }) {
  const [state, formAction, pending] = useActionState(updateClubProfileAction, {});
  const currentAccent = resolveProfileAccent(club.accentColor);
  const countryOptions = COUNTRIES.map((country) => ({ value: country, label: country }));
  const leagueOptions = LEAGUES.map((league) => ({ value: league, label: league }));

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input name="name" label="Club name" defaultValue={club.name} required />
      <Select
        name="country"
        label="Country"
        options={countryOptions}
        defaultValue={club.country}
        placeholder="Select…"
      />
      <Input name="city" label="City" defaultValue={club.city ?? ''} />
      <Select
        name="league"
        label="League or division"
        options={leagueOptions}
        defaultValue={club.league ?? ''}
        placeholder="Select…"
      />
      <Input
        name="foundedYear"
        type="number"
        label="Founded in"
        placeholder="1998"
        defaultValue={club.foundedYear ?? ''}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          About the club
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={club.description ?? ''}
          placeholder="Project, methodology, facilities and what the club offers."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Personalización: headline, chips y acento (igual que el perfil del jugador). */}
      <fieldset
        id="personalizacion"
        className="flex flex-col gap-4 rounded-xl border border-border/60 p-4"
      >
        <legend className="px-1 text-sm font-semibold">Profile customisation</legend>

        <Input
          name="headline"
          label="Headline"
          maxLength={PROFILE_HEADLINE_MAX}
          placeholder="E.g. Youth academy · Valencia"
          defaultValue={club.headline ?? ''}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Tags <span className="text-muted-foreground">(max. {CLUB_PROFILE_TAGS_MAX})</span>
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CLUB_PROFILE_TAGS.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tags"
                  value={value}
                  defaultChecked={club.tags?.includes(value) ?? false}
                  className="h-4 w-4 rounded border-border bg-white/5 accent-emerald-400"
                />
                {CLUB_PROFILE_TAG_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Profile colour</legend>
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
            It applies to the crest ring, the headline and your profile chips.
          </p>
        </fieldset>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
