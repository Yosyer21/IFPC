'use client';

import { useActionState } from 'react';
import { Button, Select } from '@ifpc/ui';
import { requestBookingAction } from '@/app/actions/bookings';
import {
  BOOKING_SESSION_LABELS,
  BOOKING_SESSION_TYPES,
  priceForSession,
} from '@/lib/bookings';

export function BookingRequestForm({
  healthAgentId,
  fullPrice,
  slots,
}: {
  healthAgentId: string;
  fullPrice: number;
  slots: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(requestBookingAction, {});

  const options = BOOKING_SESSION_TYPES.map((type) => {
    const label = BOOKING_SESSION_LABELS[type];
    return {
      value: type,
      label: fullPrice > 0 ? `${label} · ${priceForSession(fullPrice, type)}` : label,
    };
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="healthAgentId" value={healthAgentId} />
      <Select name="sessionType" label="Session type" options={options} defaultValue="FULL" />
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This specialist has no available times yet. Check back soon.
        </p>
      ) : (
        <Select
          name="slotId"
          label="Available time"
          options={slots.map((slot) => ({ value: slot.id, label: slot.label }))}
          placeholder="Pick a time…"
          required
        />
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes for the specialist
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Goals, injury history, anything they should know."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-[#4f6b0a]">{state.success}</p> : null}

      <Button type="submit" disabled={pending || slots.length === 0}>
        {pending ? 'Sending…' : 'Request booking'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Players under 16: your parent will approve and pay before the specialist sees it.
      </p>
    </form>
  );
}
