# Payments

## Current phase (simulated)

- Planes: FREE, PREMIUM (59,99 €), SCOUT (149,99 €), CLUB (299,99 €) al año.
- La acción `upgradeMembershipAction` crea/actualiza la `Membership` (12 meses) y registra un `Payment`
  con estado `PAID`.
- `scripts:expire-memberships` y el job del worker marcan como vencidas las membresías caducadas.

## Objetivo (Stripe)

1. Sesión de checkout de Stripe para el plan elegido.
2. Webhook (`STRIPE_WEBHOOK_SECRET`) → confirmación de pago → `Payment` + `Membership`.
3. Gestión de suscripciones (cancelación, renovación) en `lib/payments`.

## Variables

`STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET`
