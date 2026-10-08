'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { markNotificationsReadAction } from '@/app/actions/player';
import { IconBell } from '@/components/dashboard/icons';
import { formatRelativeTime, type FeedNotification } from '@/lib/discovery';

/**
 * Campana de avisos del feed. Los avisos llegan ya resueltos del servidor y
 * "marcar como leídos" reutiliza la acción que ya existía.
 */
export function NotificationsBell({
  notifications,
  unread,
  compact = false,
}: {
  notifications: FeedNotification[];
  unread: number;
  /** Versión reducida y a ancho completo, para el sidebar. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [markedRead, setMarkedRead] = useState(false);
  const [pending, startTransition] = useTransition();

  const pendingCount = markedRead ? 0 : unread;

  const markRead = () => {
    startTransition(async () => {
      setMarkedRead(true);
      await markNotificationsReadAction();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={pendingCount > 0 ? `Avisos, ${pendingCount} sin leer` : 'Avisos'}
        className={`inline-flex items-center gap-2 rounded-full border border-border bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground ${
          compact ? 'w-full justify-start px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <IconBell className="h-4 w-4" />
        Avisos
        {pendingCount > 0 ? (
          <span className="rounded-full bg-emerald-500/20 px-1.5 text-xs font-semibold text-emerald-300">
            {pendingCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute top-full z-50 mt-2 max-w-[85vw] rounded-2xl border border-white/10 bg-[#0b0f0d]/95 p-3 shadow-xl backdrop-blur-xl ${
            compact ? 'left-0 w-72' : 'right-0 w-80'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Avisos</span>
            <button
              type="button"
              onClick={markRead}
              disabled={pending || pendingCount === 0}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {pending ? 'Marcando…' : 'Marcar como leídos'}
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Todavía no tienes avisos.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.link ?? '/dashboard/discovery'}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <span className="text-xs font-semibold">
                      {notification.title}
                      {notification.count > 1 ? ` (${notification.count})` : ''}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {notification.message} · {formatRelativeTime(notification.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
