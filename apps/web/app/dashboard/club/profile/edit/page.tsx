import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { ClubBannerForm } from '@/components/club/club-banner-form';
import { ClubLogo } from '@/components/club/club-logo';
import { ClubLogoEditor } from '@/components/club/club-logo-editor';
import { ClubProfileEditForm } from '@/components/club/profile-edit-form';

export const metadata: Metadata = { title: 'Edit club profile' };

const EDIT_PATH = '/dashboard/club/profile/edit';

export default async function ClubProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit club profile</h1>
        <Link
          href="/dashboard/club/profile"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to profile
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold">Cover photo</h2>
            <p className="text-sm text-muted-foreground">
              The image that heads your profile. If you do not upload one, a gradient with your
              accent colour is used.
            </p>
          </div>
          <ClubBannerForm imageUrl={club.bannerUrl} redirectTo={EDIT_PATH} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">Club crest</h2>
            <p className="text-sm text-muted-foreground">
              Square logo: it replaces the initials in the header and next to your posts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ClubLogo name={club.name} logoUrl={club.logoUrl} size="md" />
            <ClubLogoEditor hasLogo={Boolean(club.logoUrl)} redirectTo={EDIT_PATH} />
          </div>
        </CardContent>
      </Card>

      <ClubProfileEditForm club={club} />
    </div>
  );
}
