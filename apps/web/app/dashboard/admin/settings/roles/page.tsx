import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { ROLES } from '@future-buller/auth';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Roles · Ajustes' };

const ROLE_INFO: Record<string, { label: string; description: string; prefix: string }> = {
  PLAYER: {
    label: 'Jugador',
    description: 'Perfil profesional, desarrollo, oportunidades y contenidos de entrenamiento.',
    prefix: '/dashboard/player',
  },
  PARENT: {
    label: 'Familiar',
    description: 'Acompañamiento de hijos deportistas, educación, pagos y rutas.',
    prefix: '/dashboard/parent',
  },
  COACH: {
    label: 'Entrenador',
    description: 'Evaluaciones, objetivos y seguimiento de sus jugadores.',
    prefix: '/dashboard/coach',
  },
  SCOUT: {
    label: 'Ojeador',
    description: 'Exploración, guardado de jugadores e informes de scouting.',
    prefix: '/dashboard/scout',
  },
  AGENT: {
    label: 'Agente',
    description: 'Representación de jugadores y gestión de reclutamiento.',
    prefix: '/dashboard/agent',
  },
  CLUB: {
    label: 'Club',
    description: 'Centro de reclutamiento, oportunidades y requisitos.',
    prefix: '/dashboard/club',
  },
  UNIVERSITY: {
    label: 'Universidad',
    description: 'Reclutamiento académico-deportivo y becas.',
    prefix: '/dashboard/university',
  },
  ADMIN: {
    label: 'Administrador',
    description: 'Centro de control, moderación, contenido y configuración global.',
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
                  Área: <span className="font-mono">{info?.prefix ?? '—'}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
