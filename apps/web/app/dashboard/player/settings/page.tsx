import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default async function PlayerSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  const items = [
    { href: '/dashboard/player/settings/account', label: 'Cuenta', description: `Name y email (${user.email})` },
    { href: '/dashboard/player/settings/privacy', label: 'Privacy', description: 'Control who sees your profile' },
    { href: '/dashboard/player/settings/notifications', label: 'Notifications', description: 'Alert preferences' },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Gestiona tu cuenta, privacidad y preferencias"
        icon="settings"
      />
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="transition-colors group-hover:border-primary">
              <CardContent>
                <h2 className="font-semibold">{item.label}</h2>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
