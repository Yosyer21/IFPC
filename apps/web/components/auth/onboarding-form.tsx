'use client';

import { useActionState } from 'react';
import { completeOnboardingAction, type ActionState } from '@/app/actions/auth';
import { Button, Input } from '@ifpc/ui';

export interface OnboardingField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

export function OnboardingForm({ role, fields }: { role: string; fields: OnboardingField[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    completeOnboardingAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      {fields.map((field) =>
        field.type === 'textarea' ? (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>
        ) : (
          <Input
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type ?? 'text'}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
      )}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar y continuar'}
      </Button>
    </form>
  );
}
