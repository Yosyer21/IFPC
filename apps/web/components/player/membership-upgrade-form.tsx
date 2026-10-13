'use client';

import { useActionState } from 'react';
import { startCheckoutAction } from '@/app/actions/membership';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@ifpc/ui';
import type { MembershipTier } from '@ifpc/types';

const PLANS: {
  tier: MembershipTier;
  label: string;
  price: string;
  features: string[];
}[] = [
  {
    tier: 'FREE',
    label: 'Gratis',
    price: '0 €',
    features: ['Basic profile', 'Training content', 'Apply to opportunities'],
  },
  {
    tier: 'PREMIUM',
    label: 'Premium',
    price: '€99/year',
    features: ['Featured profile', 'Unlimited videos', 'Development statistics', 'Verified badge'],
  },
  {
    tier: 'SCOUT',
    label: 'Scout',
    price: '€199/year',
    features: ['Access to scouting reports', 'Advanced player search', 'Save players'],
  },
  {
    tier: 'CLUB',
    label: 'Club',
    price: '€499/year',
    features: ['Post opportunities', 'Player requirements', 'Full matching access'],
  },
];

export function MembershipUpgradeForm({ currentTier }: { currentTier: string }) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, {});

  return (
    <div>
      {state.error ? <p className="mb-4 text-sm text-destructive">{state.error}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.tier} className={currentTier === plan.tier ? 'border-primary' : ''}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{plan.label}</CardTitle>
              {currentTier === plan.tier ? <Badge variant="success">Actual</Badge> : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-2xl font-bold">{plan.price}</div>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
              {plan.tier !== 'FREE' && currentTier !== plan.tier ? (
                <form action={formAction}>
                  <input type="hidden" name="tier" value={plan.tier} />
                  <Button type="submit" variant="outline" disabled={pending} className="w-full">
                    {pending ? 'Procesando…' : `Cambiar a ${plan.label}`}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        With Stripe configured you are redirected to secure payment. In development without a key,
        the payment is recorded as simulated.
      </p>
    </div>
  );
}
