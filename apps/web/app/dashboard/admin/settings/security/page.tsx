import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Seguridad · Ajustes' };

export default async function AdminSettingsSecurityPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const checks: { label: string; value: string; ok: boolean; hint?: string }[] = [
    {
      label: 'AUTH_SECRET',
      value: process.env.AUTH_SECRET ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.AUTH_SECRET),
      hint: 'Secreto de firma de sesiones de Auth.js',
    },
    {
      label: 'DATABASE_URL',
      value: process.env.DATABASE_URL ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.DATABASE_URL),
      hint: 'Conexión a PostgreSQL (en desarrollo: PGlite embebido)',
    },
    {
      label: 'NEXT_PUBLIC_APP_URL',
      value: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      ok: true,
      hint: 'URL base usada en enlaces de recuperación',
    },
    {
      label: 'RESEND_API_KEY',
      value: process.env.RESEND_API_KEY ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.RESEND_API_KEY),
      hint: 'Correos de verificación y recuperación (pendiente)',
    },
    {
      label: 'STRIPE_SECRET_KEY',
      value: process.env.STRIPE_SECRET_KEY ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.STRIPE_SECRET_KEY),
      hint: 'Pagos reales (pendiente, hoy simulados)',
    },
    {
      label: 'S3_ENDPOINT',
      value: process.env.S3_ENDPOINT ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.S3_ENDPOINT),
      hint: 'Almacenamiento de objetos (pendiente, hoy uploads locales)',
    },
  ];

  const practices = [
    'Contraseñas cifradas con bcryptjs (10 rondas).',
    'Tokens de recuperación con hash sha256 y caducidad de 1 hora.',
    'Protección de rutas /dashboard con middleware y guard por rol.',
    'Acciones de administración protegidas con requireAdmin().',
    'IDs generados con cuid() (sin enumeración de recursos).',
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Seguridad"
        subtitle="Estado de las variables y prácticas de seguridad"
        icon="shield"
      />

      <Card>
        <CardContent>
          <h2 className="mb-3 font-semibold">Variables de entorno</h2>
          <div className="flex flex-col gap-2">
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{check.label}</p>
                  {check.hint ? (
                    <p className="text-xs text-muted-foreground">{check.hint}</p>
                  ) : null}
                </div>
                <Badge variant={check.ok ? 'success' : 'warning'}>{check.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <h2 className="mb-3 font-semibold">Prácticas aplicadas</h2>
          <ul className="flex flex-col gap-1.5">
            {practices.map((practice) => (
              <li key={practice} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">✓</span>
                {practice}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
