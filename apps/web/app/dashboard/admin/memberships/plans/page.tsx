import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Planes de membresía' };

const PLANS = [
  { tier: 'FREE', price: '0 €', features: ['Perfil básico', 'Contenido', 'Aplicar a oportunidades'] },
  { tier: 'PREMIUM', price: '59,99 €/año', features: ['Perfil destacado', 'Vídeos ilimitados', 'Estadísticas'] },
  { tier: 'SCOUT', price: '149,99 €/año', features: ['Informes de scouting', 'Búsqueda avanzada'] },
  { tier: 'CLUB', price: '299,99 €/año', features: ['Oportunidades', 'Requisitos', 'Matching completo'] },
];

export default async function AdminMembershipPlansPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/admin/memberships"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Membresías
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Planes de membresía</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.tier}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{plan.tier}</h2>
                <Badge>{plan.price}</Badge>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Los precios y beneficios se gestionarán desde la configuración en próximas fases. Los pagos
        son simulados hasta la integración con Stripe.
      </p>
    </div>
  );
}
