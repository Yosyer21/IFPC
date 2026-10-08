'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleFollowAction } from '@/app/actions/discovery';

/**
 * Botón de seguir/dejar de seguir. El estado inicial lo aporta el servidor y el
 * cambio se pinta al instante (`useOptimistic`), confirmándose con la acción.
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
  const [following, setFollowing] = useOptimistic(isFollowing);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      setFollowing(!following);
      const data = new FormData();
      data.set('userId', userId);
      await toggleFollowAction(data);
    });
  };

  const size = compact
    ? 'px-2.5 py-1 text-xs font-semibold'
    : 'px-4 py-2 text-sm font-semibold';
  const style = following
    ? 'border border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
    : 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-400 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:brightness-105';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={`inline-flex items-center justify-center rounded-full transition-all disabled:opacity-50 ${size} ${style}`}
    >
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  );
}
