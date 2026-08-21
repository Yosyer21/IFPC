import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Ajustes' };

const SECTIONS = [
  {
    href: '/dashboard/admin/settings/countries',
    title: 'Países',
    description: 'Mercados configurados y presencia por país',
  },
  {
    href: '/dashboard/admin/settings/leagues',
    title: 'Ligas',
    description: 'Competiciones de los clubes registrados',
  },
  {
    href: '/dashboard/admin/settings/roles',
    title: 'Roles',
    description: 'Tipos de cuenta y base de usuarios por rol',
  },
  {
    href: '/dashboard/admin/settings/permissions',
    title: 'Permisos',
    description: 'Matriz de capacidades por rol',
  },
  {
    href: '/dashboard/admin/settings/security',
    title: 'Seguridad',
    description: 'Variables de entorno y prácticas de seguridad',
  },
  {
    href: '/dashboard/admin/settings/system',
    title: 'Sistema',
    description: 'Estado general de la plataforma y workers',
  },
];

export default async function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Ajustes"
        subtitle="Configuración general de la plataforma"
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
                  Abrir →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
