'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import {
  HEALTH_AGENT_CURRENCIES,
  HEALTH_AGENT_FORMATS,
  HEALTH_AGENT_SPECIALTIES,
} from '@ifpc/validation';
import { updateHealthAgentProfileAction } from '@/app/actions/health-agent';
import {
  HEALTH_AGENT_FORMAT_LABELS,
  HEALTH_AGENT_SPECIALTY_LABELS,
} from '@/lib/health-agent';

/** Datos serializables que el formulario necesita (sin tipos de Prisma). */
export interface HealthAgentFormValues {
  practiceName: string;
  headline: string | null;
  about: string | null;
  specialties: string[];
  services: string[];
  approach: string[];
  registrationNumber: string | null;
  insuranceProvider: string | null;
  insuranceExpiresAt: string | null;
  priceFrom: number | null;
  currency: string;
  format: string;
  sessionsOnline: boolean;
  languages: string[];
  city: string | null;
  country: string | null;
  website: string | null;
  yearsExperience: number | null;
  clientsServed: number | null;
  availabilityNote: string | null;
}

const textareaClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring';

export function HealthAgentProfileEditForm({ agent }: { agent: HealthAgentFormValues | null }) {
  const [state, formAction, pending] = useActionState(updateHealthAgentProfileAction, {});

  const currencyOptions = HEALTH_AGENT_CURRENCIES.map((value) => ({ value, label: value }));
  const formatOptions = HEALTH_AGENT_FORMATS.map((value) => ({
    value,
    label: HEALTH_AGENT_FORMAT_LABELS[value] ?? value,
  }));

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          name="practiceName"
          label="Practice name"
          defaultValue={agent?.practiceName ?? ''}
          placeholder="Fuel Lab Sports Nutrition"
          required
        />
        <Input
          name="headline"
          label="Headline"
          maxLength={140}
          defaultValue={agent?.headline ?? ''}
          placeholder="Nutrition, psychology and physio for young athletes"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Specialties (choose at least one)</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {HEALTH_AGENT_SPECIALTIES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialties"
                value={value}
                defaultChecked={agent?.specialties.includes(value) ?? false}
                className="h-4 w-4 rounded border-border bg-muted accent-brand"
              />
              {HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="about" className="text-sm font-medium">
          About your practice
        </label>
        <textarea
          id="about"
          name="about"
          rows={4}
          defaultValue={agent?.about ?? ''}
          placeholder="Who you help, how you work and what families can expect."
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="services" className="text-sm font-medium">
            Services <span className="text-muted-foreground">(comma separated)</span>
          </label>
          <textarea
            id="services"
            name="services"
            rows={2}
            defaultValue={agent?.services.join(', ') ?? ''}
            placeholder="Match-day fuel plans, Confidence & focus programmes, Return-to-play plans"
            className={textareaClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="approach" className="text-sm font-medium">
            Approach to care <span className="text-muted-foreground">(comma separated)</span>
          </label>
          <textarea
            id="approach"
            name="approach"
            rows={2}
            defaultValue={agent?.approach.join(', ') ?? ''}
            placeholder="Food first, No weigh-ins for young players, Parents involved"
            className={textareaClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-border/60 p-4">
        <legend className="px-1 text-sm font-semibold">Practice details</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="registrationNumber"
            label="Professional registration no."
            defaultValue={agent?.registrationNumber ?? ''}
            placeholder="HA-2026-001"
          />
          <Input
            name="insuranceProvider"
            label="Insurance provider"
            defaultValue={agent?.insuranceProvider ?? ''}
            placeholder="SportSafe"
          />
          <Input
            name="insuranceExpiresAt"
            type="date"
            label="Insurance expires"
            defaultValue={agent?.insuranceExpiresAt ?? ''}
          />
          <Input
            name="priceFrom"
            type="number"
            min={0}
            label="Price from"
            defaultValue={agent?.priceFrom ?? ''}
            placeholder="60"
          />
          <Select
            name="currency"
            label="Currency"
            options={currencyOptions}
            defaultValue={agent?.currency ?? 'EUR'}
          />
          <Select
            name="format"
            label="Session format"
            options={formatOptions}
            defaultValue={agent?.format ?? 'BOTH'}
          />
          <Input
            name="yearsExperience"
            type="number"
            min={0}
            label="Years of experience"
            defaultValue={agent?.yearsExperience ?? ''}
          />
          <Input
            name="clientsServed"
            type="number"
            min={0}
            label="Clients served"
            defaultValue={agent?.clientsServed ?? ''}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sessionsOnline"
            defaultChecked={agent?.sessionsOnline ?? true}
            className="h-4 w-4 rounded border-border bg-muted accent-brand"
          />
          Offer online sessions
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-border/60 p-4">
        <legend className="px-1 text-sm font-semibold">Location and contact</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="city" label="City" defaultValue={agent?.city ?? ''} placeholder="Valencia" />
          <Input
            name="country"
            label="Country"
            defaultValue={agent?.country ?? ''}
            placeholder="Spain"
          />
          <Input
            name="website"
            label="Website"
            defaultValue={agent?.website ?? ''}
            placeholder="https://yourpractice.com"
          />
          <Input
            name="languages"
            label="Languages"
            defaultValue={agent?.languages.join(', ') ?? ''}
            placeholder="English, Spanish"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="availabilityNote" className="text-sm font-medium">
            Availability note
          </label>
          <textarea
            id="availabilityNote"
            name="availabilityNote"
            rows={2}
            defaultValue={agent?.availabilityNote ?? ''}
            placeholder="Weekdays after school; online worldwide."
            className={textareaClass}
          />
        </div>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
