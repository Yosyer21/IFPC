import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Preferencias de notificaciones' };

export default async function PlayerNotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/settings"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Ajustes
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Notificaciones</h1>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>You will receive notifications within the platform for events such as:</p>
          <ul className="list-inside list-disc">
            <li>Respuesta de un club a tu solicitud</li>
            <li>New opportunities that match your profile</li>
            <li>Resultados de pruebas y evaluaciones</li>
            <li>Mensajes de ojeadores y agentes</li>
          </ul>
          <p>
            Channel preferences (email/push) will be configured in upcoming phases. Notifications
            actuales aparecen en <Link href="/dashboard/player/notifications" className="text-primary hover:underline">Notificaciones</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
