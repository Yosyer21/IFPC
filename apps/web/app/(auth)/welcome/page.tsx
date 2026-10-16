import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { CompleteSignupForm } from '@/components/auth/complete-signup-form';
import { PlayerAvatar } from '@/components/player/avatar';
import { nameParts } from '@/lib/names';

export const metadata: Metadata = { title: 'Finish your signup' };

/**
 * Último paso del alta con Google: el callback `signIn` ya creó la cuenta (sin
 * perfil de rol), así que aquí solo falta elegir qué es. Al terminar se entra al
 * dashboard del rol elegido con la animación de bienvenida.
 */
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, role: true, onboardedAt: true },
  });
  if (!user) redirect('/login');
  if (user.onboardedAt) redirect(`/dashboard/${user.role.toLowerCase()}`);

  const { firstName, lastName } = nameParts(user.name);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <PlayerAvatar firstName={firstName} lastName={lastName} imageUrl={user.image} size="md" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">Welcome, {firstName || 'there'}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Tell us what kind of account you want and we will set everything up — it takes four steps.
      </p>

      <CompleteSignupForm accountName={user.name} />
    </div>
  );
}
