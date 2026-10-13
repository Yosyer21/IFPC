import { Select } from '@ifpc/ui';

/**
 * Bloque de visibilidad que comparten el formulario de contenido y el de
 * sesiones: el desplegable (publicar ya / programar / borrador) y la fecha de
 * programación. La semántica la resuelve `resolveTrainingVisibility` en el
 * servidor, así que aquí solo se recogen los dos campos.
 */

/** Opciones del desplegable de visibilidad. */
export const VISIBILITY_OPTIONS = [
  { value: 'PUBLISHED', label: 'Published — visible for your players now' },
  { value: 'SCHEDULED', label: 'Scheduled — pick a date below' },
  { value: 'DRAFT', label: 'Draft — only you can see it' },
];

/**
 * Valor para el `datetime-local` en la zona horaria del navegador
 * (`YYYY-MM-DDTHH:mm`). El servidor trabaja en UTC, así que el valor se calcula
 * en el cliente y el input lleva `suppressHydrationWarning` para no avisar de la
 * diferencia con el HTML inicial.
 */
export function toLocalDateTimeValue(date: Date | null): string {
  if (!date) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Visibilidad con la que se abre el formulario: la actual, o publicar ya. */
export function defaultVisibility(
  state: { status: string; publishAt: Date | null } | null | undefined,
  now: Date = new Date()
): string {
  if (!state) return 'PUBLISHED';
  if (state.status === 'DRAFT') return 'DRAFT';
  return state.publishAt && state.publishAt.getTime() > now.getTime() ? 'SCHEDULED' : 'PUBLISHED';
}

export interface VisibilityFieldsProps {
  /** Opción que aparece elegida al abrir el formulario. */
  defaultValue: string;
  /** Fecha de publicación programada actual, si la tiene. */
  publishAt?: Date | null;
  /** Texto de ayuda bajo la fecha (cambia según lo que se publique). */
  hint?: string;
}

export function VisibilityFields({
  defaultValue,
  publishAt = null,
  hint = 'Your players get a notification when it becomes visible.',
}: VisibilityFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border/70 p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">Visibility</legend>
      <Select
        name="visibility"
        label="Who can see it"
        options={VISIBILITY_OPTIONS}
        defaultValue={defaultValue}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="publishAt" className="text-sm font-medium">
          Publish date <span className="text-muted-foreground">(only for scheduled)</span>
        </label>
        <input
          id="publishAt"
          name="publishAt"
          type="datetime-local"
          defaultValue={toLocalDateTimeValue(publishAt)}
          suppressHydrationWarning
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </fieldset>
  );
}
