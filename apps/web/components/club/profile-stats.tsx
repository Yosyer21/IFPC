import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import {
  IconFile,
  IconInbox,
  IconLive,
  IconMessageCircle,
  IconTarget,
  IconUsers,
} from '@/components/dashboard/icons';

export interface ClubProfileStatsProps {
  /** Oportunidades abiertas. */
  openOpportunities: number;
  /** Candidaturas recibidas (totales). */
  applications: number;
  /** Candidaturas pendientes de revisar. */
  pendingApplications: number;
  /** Perfiles buscados activos. */
  requirements: number;
  /** Consultas recibidas. */
  inquiries: number;
  /** Publicaciones del club en Discovery. */
  posts: number;
  /** Directos creados por el club. */
  liveSessions: number;
  className?: string;
}

/**
 * Panel frontal del perfil del club: lo que un jugador (o su familia) quiere
 * saber de un vistazo. Mismo lenguaje visual que la tarjeta de métricas del
 * perfil del jugador, pero con las cifras del club.
 */
export function ClubProfileStats({
  openOpportunities,
  applications,
  pendingApplications,
  requirements,
  inquiries,
  posts,
  liveSessions,
  className,
}: ClubProfileStatsProps) {
  const kpis: {
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    value: number;
  }[] = [
    {
      href: '/dashboard/club/opportunities',
      icon: IconTarget,
      label: 'Open opportunities',
      value: openOpportunities,
    },
    {
      href: '/dashboard/club/applications',
      icon: IconUsers,
      label: 'Applications',
      value: applications,
    },
    {
      href: '/dashboard/club/applications',
      icon: IconInbox,
      label: 'Pending review',
      value: pendingApplications,
    },
    {
      href: '/dashboard/club/requirements',
      icon: IconFile,
      label: 'Active requirements',
      value: requirements,
    },
    {
      href: '/dashboard/club/inquiries',
      icon: IconMessageCircle,
      label: 'Enquiries',
      value: inquiries,
    },
    { href: '/dashboard/club/live-sessions', icon: IconLive, label: 'Live sessions', value: liveSessions },
    {
      href: '/dashboard/club/profile#publicaciones',
      icon: IconMessageCircle,
      label: 'Discovery posts',
      value: posts,
    },
  ];

  return (
    <Card className={`animate-fade-up ${className ?? ''}`} style={{ animationDelay: '80ms' }}>
      <CardContent className="flex flex-col gap-4">
        <h2 className="font-semibold">Club activity</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate text-xs">{kpi.label}</span>
                </span>
                <span className="mt-1 block text-2xl font-bold tabular-nums">{kpi.value}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
