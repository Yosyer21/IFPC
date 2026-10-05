import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role.toLowerCase();

  // Cabecera del sidebar (nombre + foto) y contador de avisos del área de jugador.
  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
    role === 'player'
      ? prisma.notification.count({ where: { userId: session.user.id, read: false } })
      : Promise.resolve(undefined),
  ]);

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div
        className="app-ambient pointer-events-none fixed inset-0 -z-10 bg-[#070b09]"
        aria-hidden="true"
      />
      <div
        className="bg-grid-faint pointer-events-none fixed inset-0 -z-10 opacity-30"
        aria-hidden="true"
      />
      <DashboardSidebar
        role={role}
        unreadCount={unreadCount}
        userName={user?.name ?? session.user.name ?? ''}
        userImage={user?.image ?? null}
      />
      <main className="relative flex-1 p-6">{children}</main>
    </div>
  );
}


