import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { ROLES } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Permisos · Settings' };

const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLAYER: ['Edit profile', 'Upload videos', 'Upload documents', 'Apply to opportunities', 'Save opportunities', 'See training content'],
  PARENT: ['Ver hijos vinculados', 'Education for families', 'See your children’s opportunities', 'Historial de pagos'],
  COACH: ['Gestionar players asignados', 'Crear evaluations', 'Crear goals', 'Asignar contenido'],
  SCOUT: ['Explore players', 'Save players', 'Crear reports de scouting'],
  AGENT: ['Link players', 'Send players to clubs', 'Gestionar pruebas, negociaciones y contratos'],
  CLUB: ['Post opportunities', 'Crear requirements', 'Revisar requests', 'Responder consultas', 'Gestionar staff'],
  UNIVERSITY: ['View players', 'See opportunities and scholarships'],
  SCHOOL: [
    'See available participants',
    'Explore clinics and programs',
    'Inscribir grupos en camps',
    'See opportunities for their students',
  ],
  ADMIN: ['Acceso total', 'Verify players and clubs', 'Gestionar usuarios y roles', 'Post content', 'Ver analytics', 'System settings'],
};

export default async function AdminSettingsPermissionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const roleCounts = new Map(usersByRole.map((row) => [row.role, row._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Permisos"
        subtitle="Matriz de capacidades por rol"
        icon="shield"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardContent>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-semibold">{role}</h2>
                <Badge variant="outline">{(roleCounts.get(role) ?? 0) + ' cuentas'}</Badge>
              </div>
              <ul className="flex flex-col gap-1.5">
                {(ROLE_PERMISSIONS[role] ?? []).map((permission) => (
                  <li key={permission} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-primary">✓</span>
                    {permission}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
