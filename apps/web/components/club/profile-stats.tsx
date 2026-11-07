import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
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
    <section
      className={`fb-panel animate-fade-up relative overflow-hidden p-5 sm:p-6 ${className ?? ''}`}
    >
      <div className="relative flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Club activity</h2>
        <span className="fb-section-label text-white/40">At a glance</span>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="rounded-xl border border-white/10 px-4 py-3 transition-colors hover:border-brand/40 hover:bg-white/5"
            >
              <span className="flex items-center gap-1.5 text-white/50">
                <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {kpi.label}
                </span>
              </span>
              <span className="mt-1 block font-display text-3xl leading-none text-brand tabular-nums">
                {kpi.value}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
