'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { createScholarshipAction } from '@/app/actions/scholarships';

const COVERAGE_OPTIONS = [
  { value: 'FULL', label: 'Full scholarship' },
  { value: 'PARTIAL', label: 'Partial scholarship' },
  { value: 'BOARDING', label: 'Boarding place' },
];

export function ScholarshipForm() {
  const [state, formAction, pending] = useActionState(createScholarshipAction, {});
  const nextYear = new Date().getFullYear() + 1;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="title"
        label="Programme title"
        placeholder="University sports scholarship — intake 2027"
        required
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          name="coverage"
          label="Coverage"
          options={COVERAGE_OPTIONS}
          defaultValue="FULL"
          required
        />
        <Input name="spots" type="number" min={1} max={500} label="Spots" defaultValue={1} required />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input name="amount" label="Funding" placeholder="100% tuition" />
        <Input name="minGpa" type="number" step="0.1" min={0} max={4} label="Minimum GPA" />
        <Input name="intakeYear" type="number" min={2024} max={2100} label="Intake year" defaultValue={nextYear} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input name="position" label="Position" placeholder="All positions" />
        <Input name="ageMin" type="number" min={6} max={40} label="Minimum age" />
        <Input name="ageMax" type="number" min={6} max={40} label="Maximum age" />
      </div>

      <Input name="closesAt" type="date" label="Application deadline" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Degree, football programme, academic requirements…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Publishing…' : 'Publish scholarship'}
      </Button>
    </form>
  );
}
