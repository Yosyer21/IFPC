'use client';

import { useActionState } from 'react';
import { applyToOpportunityAction } from '@/app/actions/player';
import { Button } from '@ifpc/ui';

export function ApplyForm({
  opportunityId,
  alreadyApplied,
}: {
  opportunityId: string;
  alreadyApplied: boolean;
}) {
  const [state, formAction, pending] = useActionState(applyToOpportunityAction, {});

  if (alreadyApplied) {
    return (
      <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
        You have already applied to this opportunity.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell them why you fit this opportunity…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  );
}
