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

  // Contador de notificaciones sin leer solo para el área player (badge dinámico).
  let unreadCount: number | undefined;
  if (role === 'player') {
    unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar role={role} unreadCount={unreadCount} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}


