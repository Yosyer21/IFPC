'use client';

import { useActionState } from 'react';
import { saveNotificationPreferencesAction } from '@/app/actions/notifications';
import { Button } from '@ifpc/ui';
import {
  NOTIFICATION_CATEGORIES,
  WEEKLY_DIGEST_CATEGORY,
  type NotificationPreferences,
} from '@/lib/notifications/preferences';

/**
 * Matriz de canales: una fila por categoría y una casilla por canal, más el
 * resumen semanal (solo email). La columna de email queda desactivada mientras
 * la dirección no esté verificada (no tendría sentido mandar correos a un email
 * sin confirmar).
 */
export function NotificationPreferencesForm({
  preferences,
  digestEnabled,
  emailVerified,
}: {
  preferences: NotificationPreferences;
  digestEnabled: boolean;
  emailVerified: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveNotificationPreferencesAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col divide-y divide-border/60">
        {NOTIFICATION_CATEGORIES.map((category) => {
          const preference = preferences[category.id];
          return (
            <div
              key={category.id}
              className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{category.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>
              </div>
              <div className="flex shrink-0 gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`inApp:${category.id}`}
                    defaultChecked={preference.inApp}
                    className="h-4 w-4 accent-brand"
                  />
                  In the app
                </label>
                <label
                  className={`flex items-center gap-2 text-sm ${
                    emailVerified ? 'cursor-pointer' : 'opacity-40'
                  }`}
                >
                  <input
                    type="checkbox"
                    name={`email:${category.id}`}
                    defaultChecked={preference.email}
                    disabled={!emailVerified}
                    className="h-4 w-4 accent-brand"
                  />
                  Email
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="font-medium">Weekly summary</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One email a week with what you missed: new followers, answers to your applications and
            training reminders.
          </p>
        </div>
        <div className="flex shrink-0 gap-6">
          <label
            className={`flex items-center gap-2 text-sm ${
              emailVerified ? 'cursor-pointer' : 'opacity-40'
            }`}
          >
            <input
              type="checkbox"
              name={`email:${WEEKLY_DIGEST_CATEGORY}`}
              defaultChecked={digestEnabled}
              disabled={!emailVerified}
              className="h-4 w-4 accent-brand"
            />
            Email
          </label>
        </div>
      </div>

      {emailVerified ? null : (
        <p className="text-xs text-muted-foreground">
          Email notifications need a verified address: confirm it in Account settings.
        </p>
      )}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-brand">{state.success}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  );
}
