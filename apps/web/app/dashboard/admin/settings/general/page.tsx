import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Configuración general' };

export default async function AdminSettingsGeneralPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const environment = process.env.NODE_ENV ?? 'development';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const databaseUrl = process.env.DATABASE_URL ?? 'no configurado';
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);

  const rows: [string, string][] = [
    ['Entorno', environment],
    ['URL de la app', appUrl],
    ['Base de datos', databaseUrl.includes('@') ? `${databaseUrl.split('@')[0]}@…` : databaseUrl],
    ['Stripe', stripeConfigured ? 'Configurado' : 'No configurado (pagos simulados)'],
    ['Resend (email)', resendConfigured ? 'Configurado' : 'No configurado'],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Configuración general</h1>
      <Card>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-all font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
