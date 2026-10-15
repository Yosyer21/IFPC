import type { Metadata } from 'next';
import { isGoogleEnabled } from '@ifpc/auth';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  // Sin credenciales de Google el botón no se muestra: se configura con
  // AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.
  const googleEnabled = isGoogleEnabled();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Create account</h1>
      <RegisterForm initialRole={role} googleEnabled={googleEnabled} />
    </div>
  );
}
