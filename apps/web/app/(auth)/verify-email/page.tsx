import type { Metadata } from 'next';
import Link from 'next/link';
import { createHash } from 'node:crypto';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Verify your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let verified = false;
  let error: string | null = null;

  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt) {
      error = 'The link is not valid or has already been used.';
    } else if (record.expiresAt < new Date()) {
      error = 'The link has expired. Request a new one from your account.';
    } else {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerified: new Date() },
        }),
        prisma.emailVerificationToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
      verified = true;
    }
  } else {
    error = 'Missing verification link. Check your email or request it again.';
  }

  return (
    <div className="text-center">
      {verified ? (
        <>
          <Badge variant="success">Email verified</Badge>
          <h1 className="mb-4 mt-4 text-2xl font-bold">Your email is confirmed!</h1>
          <p className="mb-6 text-muted-foreground">
            You can now use all IFPC features.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to my area
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-4 text-2xl font-bold">Could not verify the email</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Link href="/login" className="text-sm hover:underline">
            Go to sign in
          </Link>
        </>
      )}
    </div>
  );
}

