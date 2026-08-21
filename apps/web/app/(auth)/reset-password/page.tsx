import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = { title: 'Nueva contraseña' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Enlace no válido</h1>
        <p className="text-muted-foreground">
          Solicita un nuevo enlace de recuperación para continuar.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nueva contraseña</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
