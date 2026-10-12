import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Privacy' };

export default async function PlayerPrivacySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/player/settings"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Settings
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Privacy</h1>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Tu perfil de player es visible para clubs, scouts y agents verificados cuando tu
            estado es <strong>Available</strong>.
          </p>
          <p>
            Fine-grained privacy controls (who can see your videos, direct contact and
            data export) will be enabled in upcoming platform phases.
          </p>
          <p>Usuario: {session.user.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
