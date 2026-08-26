import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { Badge, Card, CardContent } from '@ifpc/ui';

export const metadata: Metadata = { title: 'Membership plans' };

const PLANS = [
  { tier: 'FREE', price: '0 €', features: ['Basic profile', 'Contenido', 'Aplicar a oportunidades'] },
  { tier: 'PREMIUM', price: '€59.99/year', features: ['Profile destacado', 'Unlimited videos', 'Statistics'] },
  { tier: 'SCOUT', price: '€149.99/year', features: ['Informes de scouting', 'Advanced search'] },
  { tier: 'CLUB', price: '€299.99/year', features: ['Oportunidades', 'Requisitos', 'Matching completo'] },
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
        ← Memberships
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Membership plans</h1>

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
        Prices and benefits will be managed from the settings in upcoming phases. Payments
        are simulated until the Stripe integration.
      </p>
    </div>
  );
}
