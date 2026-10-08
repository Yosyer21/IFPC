import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { countUnreadNotifications, listNotifications } from '@/lib/discovery';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role.toLowerCase();

  // Cabecera del sidebar (nombre + foto) y bandeja de avisos, para **todos** los roles.
  const [user, unreadCount, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
    countUnreadNotifications(session.user.id),
    listNotifications(session.user.id),
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
        notifications={notifications}
      />
      <main className="relative flex-1 p-6">{children}</main>
    </div>
  );
}


