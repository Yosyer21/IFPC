import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <LoginForm callbackUrl={callbackUrl ?? '/dashboard'} />
    </div>
  );
}
