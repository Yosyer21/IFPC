import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  redirect(`/dashboard/${session.user.role.toLowerCase()}`);
}
