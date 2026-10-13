import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { countUnreadNotifications, listNotifications } from '@/lib/discovery';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role.toLowerCase();

  // Cabecera (nombre + foto) y bandeja de avisos, para **todos** los roles.
  const [user, unreadCount, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
    countUnreadNotifications(session.user.id),
    listNotifications(session.user.id),
  ]);

  return (
    <DashboardShell
      role={role}
      userName={user?.name ?? session.user.name ?? ''}
      userImage={user?.image ?? null}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}


