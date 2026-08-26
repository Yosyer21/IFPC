import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { ProfileEditForm } from '@/components/player/profile-edit-form';

export const metadata: Metadata = { title: 'Edit profile' };

export default async function PlayerProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <Link
          href="/dashboard/player/profile"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to profile
        </Link>
      </div>
      <ProfileEditForm player={player} />
    </div>
  );
}
