import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { EmailForm } from '@/components/account/email-form';
import { NameForm } from '@/components/account/name-form';
import { PasswordForm } from '@/components/account/password-form';
import { PhotoUploadForm } from '@/components/account/photo-upload-form';
import { PageHeader } from '@/components/player/page-header';
import { VerifyEmailBanner } from '@/components/player/verify-email-banner';

export const metadata: Metadata = { title: 'Account' };

const HERE = '/dashboard/player/settings/account';

export default async function PlayerAccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" subtitle="Your name, photo, email and password" icon="user">
        <Link
          href="/dashboard/player/settings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Settings
        </Link>
      </PageHeader>

      {user.emailVerified ? null : <VerifyEmailBanner />}

      <div className="flex flex-col gap-4">
        <Card className="animate-fade-up">
          <CardContent>
            <h2 className="mb-4 font-semibold">Photo</h2>
            <PhotoUploadForm name={user.name} imageUrl={user.image} redirectTo={HERE} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <CardContent>
            <h2 className="mb-4 font-semibold">Name</h2>
            <NameForm name={user.name} redirectTo={HERE} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Email</h2>
              {user.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Pending verification</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.emailVerified
                ? `Verified on ${user.emailVerified.toLocaleDateString('en-GB')}. We use it for account notices and password recovery.`
                : `Open the link we sent to ${user.email} to confirm your address (check the spam folder too).`}
            </p>
            <EmailForm email={user.email} hasPassword={hasPassword} />
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <CardContent className="flex flex-col gap-3">
            <h2 className="font-semibold">{hasPassword ? 'Password' : 'Create a password'}</h2>
            <PasswordForm hasPassword={hasPassword} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
