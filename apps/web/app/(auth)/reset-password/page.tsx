import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = { title: 'New password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Invalid link</h1>
        <p className="text-muted-foreground">
          Request a new recovery link to continue.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New password</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
