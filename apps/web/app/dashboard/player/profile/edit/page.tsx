import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { BannerForm } from '@/components/player/banner-form';
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

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold">Portada</h2>
            <p className="text-sm text-muted-foreground">
              La imagen que encabeza tu perfil. Si no subes ninguna, se usa un degradado con tu
              color.
            </p>
          </div>
          <BannerForm imageUrl={player.bannerUrl} redirectTo="/dashboard/player/profile/edit" />
        </CardContent>
      </Card>

      <ProfileEditForm player={player} />
    </div>
  );
}
