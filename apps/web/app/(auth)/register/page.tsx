import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Crear cuenta</h1>
      <RegisterForm initialRole={role} />
    </div>
  );
}
