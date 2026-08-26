import { createHmac, timingSafeEqual } from 'node:crypto';

const STRIPE_API = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export interface MembershipTier {
  id: 'PREMIUM' | 'SCOUT' | 'CLUB';
  label: string;
  priceCents: number;
  currency: string;
}

export const MEMBERSHIP_TIERS: Record<string, MembershipTier> = {
  PREMIUM: { id: 'PREMIUM', label: 'Premium', priceCents: 9900, currency: 'eur' },
  SCOUT: { id: 'SCOUT', label: 'Scout', priceCents: 19900, currency: 'eur' },
  CLUB: { id: 'CLUB', label: 'Club', priceCents: 49900, currency: 'eur' },
};

export function stripeConfigured(): boolean {
  return Boolean(SECRET_KEY) && SECRET_KEY !== 'sk_test_cambiar';
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  amountTotal: number;
  currency: string;
}

/**
 * Creates a Stripe Checkout Session (payment mode) for a membership.
 * Returns `null` if Stripe is not configured.
 */
export async function createCheckoutSession(input: {
  tier: 'PREMIUM' | 'SCOUT' | 'CLUB';
  userId: string;
  userEmail: string;
}): Promise<CheckoutSession | null> {
  if (!stripeConfigured() || !SECRET_KEY) return null;

  const tier = MEMBERSHIP_TIERS[input.tier];
  if (!tier) throw new Error('Invalid membership tier');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const body = new URLSearchParams({
    mode: 'payment',
    client_reference_id: input.userId,
    customer_email: input.userEmail,
    success_url: `${appUrl}/dashboard/player/membership?checkout=success`,
    cancel_url: `${appUrl}/dashboard/player/membership?checkout=cancelled`,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': tier.currency,
    'line_items[0][price_data][unit_amount]': String(tier.priceCents),
    'line_items[0][price_data][product_data][name]': `${tier.label} membership`,
    'line_items[0][price_data][product_data][description]': `Annual ${tier.label} subscription on IFPC`,
    'metadata[tier]': tier.id,
  });

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stripe HTTP ${response.status}: ${detail}`);
  }

  const session = (await response.json()) as {
    id: string;
    url: string | null;
    amount_total: number;
    currency: string;
  };
  return {
    id: session.id,
    url: session.url,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}

/**
 * Verifica la firma de un webhook de Stripe (cabecera `Stripe-Signature`).
 * Formato: `t=<timestamp>,v1=<hmac-sha256>`.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_cambiar' || !signatureHeader) return false;

  const parts = signatureHeader.split(',');
  let timestamp = '';
  let signature = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value !== undefined) timestamp = value;
    if (key === 'v1' && value !== undefined) signature = value;
  }
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
