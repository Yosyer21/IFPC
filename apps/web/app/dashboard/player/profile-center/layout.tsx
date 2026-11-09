import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/player/page-header';
import { ProfileCenterTabs } from '@/components/player/profile-center-tabs';

export const metadata: Metadata = { title: 'Profile center' };

/**
 * Marco común del Profile center: cabecera, tabs y la página activa debajo.
 * Las tres secciones siguen siendo sus páginas de siempre (misma carga de datos
 * y mismas acciones), solo que agrupadas bajo una única entrada del sidebar.
 */
export default function ProfileCenterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Profile center"
        subtitle="Your player profile, Player ID and development, in one place"
        icon="layers"
      />
      <ProfileCenterTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
