'use client';

import { useFormStatus } from 'react-dom';
import { toggleFollowAction } from '@/app/actions/discovery';

function FollowSubmit({ following, compact }: { following: boolean; compact: boolean }) {
  const { pending } = useFormStatus();

  const size = compact
    ? 'px-2.5 py-1 text-xs font-semibold'
    : 'px-4 py-2 text-sm font-semibold';
  const style = following
    ? 'border border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
    : 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:brightness-105';

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={following}
      className={`inline-flex items-center justify-center rounded-full transition-all disabled:opacity-50 ${size} ${style}`}
    >
      {pending ? '…' : following ? 'Siguiendo' : 'Seguir'}
    </button>
  );
}

/**
 * Botón de seguir/dejar de seguir. El estado lo aporta el servidor (el
 * componente no lo adivina), y el formulario se envía como server action.
 */
export function FollowButton({
  userId,
  isFollowing,
  compact = false,
}: {
  userId: string;
  isFollowing: boolean;
  compact?: boolean;
}) {
  return (
    <form action={toggleFollowAction}>
      <input type="hidden" name="userId" value={userId} />
      <FollowSubmit following={isFollowing} compact={compact} />
    </form>
  );
}
