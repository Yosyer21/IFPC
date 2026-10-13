import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Settings' };

const SECTIONS = [
  {
    href: '/dashboard/admin/settings/countries',
    title: 'Countries',
    description: 'Configured markets and presence by country',
  },
  {
    href: '/dashboard/admin/settings/leagues',
    title: 'Leagues',
    description: 'Competitions of registered clubs',
  },
  {
    href: '/dashboard/admin/settings/roles',
    title: 'Roles',
    description: 'Account types and user base by role',
  },
  {
    href: '/dashboard/admin/settings/permissions',
    title: 'Permissions',
    description: 'Capability matrix by role',
  },
  {
    href: '/dashboard/admin/settings/security',
    title: 'Security',
    description: 'Environment variables and security practices',
  },
  {
    href: '/dashboard/admin/settings/system',
    title: 'System',
    description: 'Overall platform and worker status',
  },
];

export default async function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="General platform settings"
        icon="settings"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="group block">
            <Card className="card-hover h-full">
              <CardContent>
                <h2 className="font-semibold">{section.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                <span className="mt-3 inline-block text-sm text-primary group-hover:underline">
                  Open →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
