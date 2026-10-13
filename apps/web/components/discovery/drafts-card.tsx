import Link from 'next/link';
import { deletePostAction, publishDraftAction } from '@/app/actions/discovery';
import type { FeedPost } from '@/lib/discovery-content';
import { ActionSubmit } from './action-submit';

const scheduledFormat = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Borradores y posts programadas del autor. Solo lo ve quien los
 * escribió: el feed público nunca lista posts en `DRAFT`.
 */
export function DraftsCard({ drafts }: { drafts: FeedPost[] }) {
  if (drafts.length === 0) return null;

  return (
    <section className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-4">
      <h2 className="text-sm font-semibold">
        Your drafts <span className="text-muted-foreground">({drafts.length})</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="flex flex-col gap-2 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {draft.title ?? draft.body?.slice(0, 80) ?? 'No text'}
              </p>
              <p className="text-xs text-muted-foreground">
                {draft.scheduledAt
                  ? `Scheduled for ${scheduledFormat.format(draft.scheduledAt)}`
                  : 'Unscheduled draft'}
                {draft.pollOptions.length > 0 ? ' · with poll' : ''}
                {draft.mediaUrls.length > 0 || draft.mediaUrl ? ' · with media' : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/dashboard/discovery/${draft.id}`}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                Ver
              </Link>
              <form action={publishDraftAction}>
                <input type="hidden" name="postId" value={draft.id} />
                <ActionSubmit label="Publish" pendingLabel="Publicando…" variant="primary" />
              </form>
              <form action={deletePostAction}>
                <input type="hidden" name="postId" value={draft.id} />
                <input type="hidden" name="redirectTo" value="/dashboard/discovery" />
                <ActionSubmit
                  label="Delete"
                  variant="danger"
                  confirmText="Delete the draft?"
                />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
