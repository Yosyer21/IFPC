import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { IconBell, IconFile, IconUsers, IconVideo } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Sistema · Ajustes' };

export default async function AdminSettingsSystemPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [users, players, clubs, opportunities, payments, videos, contents, submissions] =
    await Promise.all([
      prisma.user.count(),
      prisma.player.count(),
      prisma.club.count(),
      prisma.opportunity.count(),
      prisma.payment.count(),
      prisma.video.count(),
      prisma.trainingContent.count(),
      prisma.submission.count(),
    ]);

  const platform = {
    'Entorno': process.env.NODE_ENV ?? 'development',
    'Motor de base de datos': process.env.DATABASE_URL?.includes('pglite') ? 'PGlite (dev)' : 'PostgreSQL',
    'Almacenamiento': process.env.S3_ENDPOINT ? 'S3/MinIO' : 'Local (public/uploads)',
    'Correo': process.env.RESEND_API_KEY ? 'Resend' : 'No configurado',
    'Pagos': process.env.STRIPE_SECRET_KEY ? 'Stripe' : 'Simulados',
    'Workers (BullMQ)': 'Disponibles en apps/worker',
  };

  const info: [string, string][] = Object.entries(platform);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Sistema"
        subtitle="Estado general de la plataforma"
        icon="settings"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard href="/dashboard/admin/users" icon={IconUsers} label="Usuarios" value={users} />
        <StatCard href="/dashboard/admin/players" icon={IconUsers} label="Jugadores" value={players} />
        <StatCard href="/dashboard/admin/clubs" icon={IconUsers} label="Clubes" value={clubs} />
        <StatCard href="/dashboard/admin/opportunities" icon={IconBell} label="Oportunidades" value={opportunities} />
        <StatCard href="/dashboard/admin/players/evaluations" icon={IconFile} label="Contenidos" value={contents} />
        <StatCard href="/dashboard/admin/recruitment" icon={IconBell} label="Envíos" value={submissions} />
        <StatCard href="/dashboard/admin/memberships/payments" icon={IconBell} label="Pagos" value={payments} />
        <StatCard href="/dashboard/admin/players" icon={IconVideo} label="Vídeos" value={videos} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Configuración</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Workers disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {['notification', 'video-processing', 'matching', 'report', 'maintenance'].map(
                (queue) => (
                  <Badge key={queue} variant="outline">
                    {queue}
                  </Badge>
                )
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Colas definidas en apps/worker/src/queues. La integración con las acciones de la web
              está pendiente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
