import type { ReactNode } from 'react';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { PageHeader } from '@/components/player/page-header';
import { QuickClubProfileForm } from '@/components/club/quick-club-profile-form';

/**
 * Guarda del área del club. Si el usuario tiene el rol CLUB pero todavía no
 * existe su fila `Club` (cuenta nueva o rol asignado desde el admin), en vez de
 * que cada subpágina haga `notFound()` se muestra aquí un formulario para
 * crearla. Así ninguna URL /dashboard/club/* devuelve 404.
 */
export default async function ClubLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'CLUB') {
    return <>{children}</>;
  }

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (club) return <>{children}</>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Set up your club"
        subtitle="Create your club profile to unlock the recruitment centre."
        icon="briefcase"
      />
      <p className="mb-6 text-sm text-muted-foreground">
        Your account has the club role but no club profile yet. Fill in the basics to get started.
      </p>
      <QuickClubProfileForm
        defaultName={user?.name ?? session.user.name ?? ''}
        defaultEmail={user?.email ?? ''}
      />
    </div>
  );
}
