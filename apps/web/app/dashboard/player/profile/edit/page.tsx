import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { ProfileEditForm } from '@/components/player/profile-edit-form';

export const metadata: Metadata = { title: 'Editar perfil' };

export default async function PlayerProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar perfil</h1>
        <Link
          href="/dashboard/player/profile"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver al perfil
        </Link>
      </div>
      <ProfileEditForm player={player} />
    </div>
  );
}
