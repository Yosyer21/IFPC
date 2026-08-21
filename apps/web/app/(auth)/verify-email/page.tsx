import type { Metadata } from 'next';
import Link from 'next/link';
import { createHash } from 'node:crypto';
import { prisma } from '@future-buller/database';
import { Badge } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Verifica tu email' };

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
      error = 'El enlace no es válido o ya ha sido utilizado.';
    } else if (record.expiresAt < new Date()) {
      error = 'El enlace ha caducado. Solicita uno nuevo desde tu cuenta.';
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
    error = 'Falta el enlace de verificación. Revisa tu email o solicítalo de nuevo.';
  }

  return (
    <div className="text-center">
      {verified ? (
        <>
          <Badge variant="success">Email verificado</Badge>
          <h1 className="mb-4 mt-4 text-2xl font-bold">¡Tu email está confirmado!</h1>
          <p className="mb-6 text-muted-foreground">
            Ya puedes usar todas las funciones de Future Buller.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir a mi área
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-4 text-2xl font-bold">No se pudo verificar el email</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Link href="/login" className="text-sm hover:underline">
            Ir a iniciar sesión
          </Link>
        </>
      )}
    </div>
  );
}

