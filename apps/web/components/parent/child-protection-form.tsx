'use client';

import { useActionState } from 'react';
import { Button } from '@ifpc/ui';
import { updateChildProtectionAction } from '@/app/actions/parent';

export interface ChildProtectionValues {
  consentGiven: boolean;
  consentAt: string | null;
  medicalInfoRegistered: boolean;
  idVisibleToClubs: boolean;
  idVisibleToSchools: boolean;
  showStatsAndClips: boolean;
  allowDirectInvites: boolean;
  isUnder16: boolean;
}

const row = 'flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3';

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className={row}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-border bg-muted accent-brand"
      />
    </label>
  );
}

export function ChildProtectionForm({
  playerId,
  values,
}: {
  playerId: string;
  values: ChildProtectionValues;
}) {
  const [state, formAction, pending] = useActionState(updateChildProtectionAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="playerId" value={playerId} />

      {values.isUnder16 ? (
        <p className="text-xs text-muted-foreground">
          Your child is under 16: consent and visibility rules are enforced on the server.
        </p>
      ) : null}

      <div className={row}>
        <div className="flex-1">
          <p className="text-sm font-medium">Parental consent</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {values.consentGiven && values.consentAt
              ? `Given on ${values.consentAt}`
              : 'Required for players under 16 (teams and messages).'}
          </p>
        </div>
        <input
          type="checkbox"
          name="consentGiven"
          defaultChecked={values.consentGiven}
          className="mt-1 h-4 w-4 rounded border-border bg-muted accent-brand"
        />
      </div>

      <Toggle
        name="medicalInfoRegistered"
        label="Medical info on file"
        hint="Emergency contact, allergies and conditions."
        defaultChecked={values.medicalInfoRegistered}
      />
      <Toggle
        name="idVisibleToClubs"
        label="Visible to verified clubs"
        hint="Clubs see the ID before inviting to a trial."
        defaultChecked={values.idVisibleToClubs}
      />
      <Toggle
        name="idVisibleToSchools"
        label="Visible to verified schools"
        hint="Schools and universities can view the ID and scholarship profile."
        defaultChecked={values.idVisibleToSchools}
      />
      <Toggle
        name="showStatsAndClips"
        label="Show stats and clips"
        hint="Turn off to hide performance data and highlight clips."
        defaultChecked={values.showStatsAndClips}
      />
      <Toggle
        name="allowDirectInvites"
        label="Allow direct invitations"
        hint="Off: every invitation and message goes to you first."
        defaultChecked={values.allowDirectInvites}
      />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save protection settings'}
      </Button>
    </form>
  );
}
