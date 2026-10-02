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

  // Unread notifications counter only for the player area (dynamic badge).
  let unreadCount: number | undefined;
  if (role === 'player') {
    unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
  }

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
      <DashboardSidebar role={role} unreadCount={unreadCount} />
      <main className="relative flex-1 p-6">{children}</main>
    </div>
  );
}


