import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { AccountForm } from '@/components/player/account-form';
import { VerifyEmailBanner } from '@/components/player/verify-email-banner';

export const metadata: Metadata = { title: 'Cuenta' };

export default async function PlayerAccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuenta</h1>
        <Link
          href="/dashboard/player/settings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Ajustes
        </Link>
      </div>
      {!user.emailVerified ? <VerifyEmailBanner /> : null}
      <AccountForm name={user.name} email={user.email} />
    </div>
  );
}
