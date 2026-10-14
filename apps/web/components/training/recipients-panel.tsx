import { Badge, Card, CardContent } from '@ifpc/ui';
import { nudgeTrainingContentAction } from '@/app/actions/training';
import { nudgeTrainingSessionAction } from '@/app/actions/training-sessions';
import type { TrainingRecipient } from '@/lib/training-assignments';

export interface RecipientsPanelProps {
  /** Ejercicios o cursos: quién lo ha completado. */
  recipients: TrainingRecipient[];
  /** Qué se recuerda al pulsar «Send reminder». */
  target: { kind: 'content' | 'session'; id: string };
  /** Si es un borrador, nadie lo ve todavía. */
  draft?: boolean;
}

/** Estado de un destinatario: hecho, a medias o pendiente. */
function stateOf(recipient: TrainingRecipient): 'done' | 'partial' | 'pending' {
  if (recipient.totalItems !== null) {
    if (recipient.totalItems > 0 && recipient.completedItems === recipient.totalItems)
      return 'done';
    return recipient.completedItems && recipient.completedItems > 0 ? 'partial' : 'pending';
  }
  return recipient.completedAt ? 'done' : 'pending';
}

const STATE_BADGES = {
  done: { variant: 'success' as const, label: 'Done' },
  partial: { variant: 'warning' as const, label: 'In progress' },
  pending: { variant: 'outline' as const, label: 'Pending' },
};

/**
 * Panel del autor: quién recibe esto y quién lo ha hecho. Lleva el recordatorio
 * para los que faltan, que es lo que convierte la lista en algo accionable.
 */
export function TrainingRecipientsPanel({
  recipients,
  target,
  draft = false,
}: RecipientsPanelProps) {
  const pending = recipients.filter((recipient) => stateOf(recipient) !== 'done');
  const action =
    target.kind === 'session' ? nudgeTrainingSessionAction : nudgeTrainingContentAction;
  const field = target.kind === 'session' ? 'sessionId' : 'contentId';

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Who has done it</h2>
            <p className="text-xs text-muted-foreground">
              {draft
                ? 'This is still a draft: nobody sees it yet.'
                : recipients.length === 0
                  ? 'Nobody receives it yet.'
                  : `${recipients.length} ${
                      recipients.length === 1 ? 'player receives' : 'players receive'
                    } it · ${pending.length} pending`}
            </p>
          </div>
          {!draft && pending.length > 0 ? (
            <form action={action}>
              <input type="hidden" name={field} value={target.id} />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
              >
                Send reminder
              </button>
            </form>
          ) : null}
        </div>

        {recipients.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {recipients.map((recipient) => {
              const state = STATE_BADGES[stateOf(recipient)];
              return (
                <li
                  key={recipient.playerId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {recipient.name}
                    {recipient.targeted ? <Badge variant="outline">Picked</Badge> : null}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {recipient.totalItems !== null ? (
                      <span>
                        {recipient.completedItems ?? 0}/{recipient.totalItems} exercises
                      </span>
                    ) : null}
                    <Badge variant={state.variant}>{state.label}</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
