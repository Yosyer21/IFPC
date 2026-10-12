import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { ROLES } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Roles · Settings' };

const ROLE_INFO: Record<string, { label: string; description: string; prefix: string }> = {
  PLAYER: {
    label: 'Player',
    description: 'Profile profesional, desarrollo, opportunities y contenidos de training.',
    prefix: '/dashboard/player',
  },
  PARENT: {
    label: 'Familiar',
    description: 'Support for young athletes, education, payments and pathways.',
    prefix: '/dashboard/parent',
  },
  COACH: {
    label: 'Coach',
    description: 'Evaluations, goals and tracking for their players.',
    prefix: '/dashboard/coach',
  },
  SCOUT: {
    label: 'Scout',
    description: 'Discovery, saved players and scouting reports.',
    prefix: '/dashboard/scout',
  },
  AGENT: {
    label: 'Agente',
    description: 'Player representation and recruitment management.',
    prefix: '/dashboard/agent',
  },
  CLUB: {
    label: 'Club',
    description: 'Centro de reclutamiento, opportunities y requirements.',
    prefix: '/dashboard/club',
  },
  UNIVERSITY: {
    label: 'University',
    description: 'Academic-sports recruitment and scholarships.',
    prefix: '/dashboard/university',
  },
  SCHOOL: {
    label: 'School / Community service',
    description:
      'Colegios, clubs escolares y servicios comunitarios: programas, grupos y clinics inclusivas.',
    prefix: '/dashboard/school',
  },
  ADMIN: {
    label: 'Administrador',
    description: 'Control center: moderation, content and global configuration.',
    prefix: '/dashboard/admin',
  },
};

export default async function AdminSettingsRolesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const roleCounts = new Map(usersByRole.map((row) => [row.role, row._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Roles"
        subtitle="Tipos de cuenta de la plataforma y su base de usuarios"
        icon="shield"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((role) => {
          const info = ROLE_INFO[role];
          const count = roleCounts.get(role) ?? 0;
          return (
            <Card key={role}>
              <CardContent>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{info?.label ?? role}</h2>
                  <Badge>{count} usuarios</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{info?.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Area: <span className="font-mono">{info?.prefix ?? '—'}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
