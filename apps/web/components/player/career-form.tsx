'use client';

import { useActionState } from 'react';
import { saveCareerEntryAction } from '@/app/actions/player';
import { Button, Input } from '@ifpc/ui';

export interface CareerEntryValues {
  id: string;
  clubName: string;
  category: string | null;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  isCurrent: boolean;
  notes: string | null;
}

/** Formulario de una temporada de la trayectoria (alta sin `entry`, edición con él). */
export function CareerForm({ entry }: { entry?: CareerEntryValues }) {
  const [state, formAction, pending] = useActionState(saveCareerEntryAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="clubName" label="Club" defaultValue={entry?.clubName ?? ''} required />
        <Input
          name="category"
          label="Categoría"
          placeholder="Sub-17, Primer equipo…"
          defaultValue={entry?.category ?? ''}
        />
        <Input
          name="season"
          label="Temporada"
          placeholder="2024/25"
          defaultValue={entry?.season ?? ''}
          required
        />
        <div />
        <Input
          name="appearances"
          type="number"
          min={0}
          label="Partidos"
          defaultValue={entry?.appearances ?? ''}
        />
        <Input name="goals" type="number" min={0} label="Goles" defaultValue={entry?.goals ?? ''} />
        <Input
          name="assists"
          type="number"
          min={0}
          label="Asistencias"
          defaultValue={entry?.assists ?? ''}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isCurrent"
          defaultChecked={entry?.isCurrent ?? false}
          className="h-4 w-4 rounded border-border"
        />
        Equipo actual
      </label>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="career-notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="career-notes"
          name="notes"
          rows={3}
          defaultValue={entry?.notes ?? ''}
          className="w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-ring/40"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Guardando…' : entry ? 'Guardar cambios' : 'Añadir temporada'}
      </Button>
    </form>
  );
}
