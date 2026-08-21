import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { Card, CardContent } from '@future-buller/ui';

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
          <p>Recibirás avisos dentro de la plataforma para eventos como:</p>
          <ul className="list-inside list-disc">
            <li>Respuesta de un club a tu solicitud</li>
            <li>Nuevas oportunidades que encajan con tu perfil</li>
            <li>Resultados de pruebas y evaluaciones</li>
            <li>Mensajes de ojeadores y agentes</li>
          </ul>
          <p>
            Las preferencias de canal (email/push) se configurarán en próximas fases. Los avisos
            actuales aparecen en <Link href="/dashboard/player/notifications" className="text-primary hover:underline">Notificaciones</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
