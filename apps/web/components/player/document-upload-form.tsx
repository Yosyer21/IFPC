'use client';

import { useActionState } from 'react';
import { uploadDocumentAction } from '@/app/actions/player';
import { Button, Input, Select } from '@ifpc/ui';

const TYPE_OPTIONS = [
  { value: 'passport', label: 'Pasaporte' },
  { value: 'contract', label: 'Contrato' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Otro' },
];

export function DocumentUploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Input
        name="title"
        label="Document title"
        placeholder="E.g. Passport, medical certificate…"
        required
      />
      <Select name="type" label="Tipo" options={TYPE_OPTIONS} defaultValue="other" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Archivo
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Subiendo…' : 'Subir documento'}
      </Button>
    </form>
  );
}
