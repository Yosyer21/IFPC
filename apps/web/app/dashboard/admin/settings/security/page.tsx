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
      hint: 'PostgreSQL connection (development: embedded PGlite)',
    },
    {
      label: 'NEXT_PUBLIC_APP_URL',
      value: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      ok: true,
      hint: 'Base URL used in recovery links',
    },
    {
      label: 'RESEND_API_KEY',
      value: process.env.RESEND_API_KEY ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.RESEND_API_KEY),
      hint: 'Verification and recovery emails (pending)',
    },
    {
      label: 'STRIPE_SECRET_KEY',
      value: process.env.STRIPE_SECRET_KEY ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.STRIPE_SECRET_KEY),
      hint: 'Payments reales (pendiente, hoy simulados)',
    },
    {
      label: 'S3_ENDPOINT',
      value: process.env.S3_ENDPOINT ? 'Configurado' : 'Pendiente',
      ok: Boolean(process.env.S3_ENDPOINT),
      hint: 'Almacenamiento de objetos (pendiente, hoy uploads locales)',
    },
  ];

  const practices = [
    'Passwords hashed with bcryptjs (10 rounds).',
    'Recovery tokens hashed with sha256 and a 1-hour expiry.',
    'Protection of /dashboard routes with middleware and role guards.',
    'Admin actions protected with requireAdmin().',
    'IDs generated with cuid() (no resource enumeration).',
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Seguridad"
        subtitle="Status of environment variables and security practices"
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
          <h2 className="mb-3 font-semibold">Applied practices</h2>
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
