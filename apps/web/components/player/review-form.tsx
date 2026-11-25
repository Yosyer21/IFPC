'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ifpc/ui';
import { submitReviewAction } from '@/app/actions/bookings';

const RATINGS = [
  { value: '5', label: '5 ★ — excellent' },
  { value: '4', label: '4 ★ — very good' },
  { value: '3', label: '3 ★ — good' },
  { value: '2', label: '2 ★ — fair' },
  { value: '1', label: '1 ★ — poor' },
];

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, {});

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Select name="rating" label="Rating" options={RATINGS} defaultValue="5" />
      <Input name="comment" placeholder="Optional comment" maxLength={500} />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-[#4f6b0a]">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Submit review'}
      </Button>
    </form>
  );
}
