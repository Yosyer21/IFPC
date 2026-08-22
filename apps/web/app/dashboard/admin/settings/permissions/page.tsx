import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { ROLES } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Permisos · Ajustes' };

const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLAYER: ['Editar perfil', 'Subir vídeos', 'Subir documentos', 'Aplicar a oportunidades', 'Guardar oportunidades', 'Ver contenido de entrenamiento'],
  PARENT: ['Ver hijos vinculados', 'Educación para familias', 'Ver oportunidades de hijos', 'Historial de pagos'],
  COACH: ['Gestionar jugadores asignados', 'Crear evaluaciones', 'Crear objetivos', 'Asignar contenido'],
  SCOUT: ['Explorar jugadores', 'Guardar jugadores', 'Crear informes de scouting'],
  AGENT: ['Vincular jugadores', 'Enviar jugadores a clubes', 'Gestionar pruebas, negociaciones y contratos'],
  CLUB: ['Publicar oportunidades', 'Crear requisitos', 'Revisar solicitudes', 'Responder consultas', 'Gestionar staff'],
  UNIVERSITY: ['Ver jugadores', 'Ver oportunidades y becas'],
  ADMIN: ['Acceso total', 'Verificar jugadores y clubes', 'Gestionar usuarios y roles', 'Publicar contenido', 'Ver analytics', 'Configuración del sistema'],
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
