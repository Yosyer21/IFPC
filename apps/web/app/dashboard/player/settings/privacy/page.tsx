import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Privacidad' };

export default async function PlayerPrivacySettingsPage() {
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
      <h1 className="mb-6 text-2xl font-bold">Privacidad</h1>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Tu perfil de jugador es visible para clubes, ojeadores y agentes verificados cuando tu
            estado es <strong>Disponible</strong>.
          </p>
          <p>
            Los controles finos de privacidad (quién puede ver tus vídeos, contacto directo y
            exportación de datos) se habilitarán en próximas fases de la plataforma.
          </p>
          <p>Usuario: {session.user.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
