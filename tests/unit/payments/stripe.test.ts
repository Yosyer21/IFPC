import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import type * as StripeModule from '../../../apps/web/lib/payments/stripe';

const SECRET = 'whsec_test_secret';

function hmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function signatureHeader(timestamp: string, payload: string, secret = SECRET): string {
  return `t=${timestamp},v1=${hmac(secret, `${timestamp}.${payload}`)}`;
}

let stripe: typeof StripeModule;

beforeEach(async () => {
  vi.resetModules();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_cambiar';
  stripe = await import('../../../apps/web/lib/payments/stripe');
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
});

describe('lib/payments/stripe', () => {
  it('stripeConfigured es false con la key placeholder', () => {
    expect(stripe.stripeConfigured()).toBe(false);
  });

  it('stripeConfigured es true con una key real', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    vi.resetModules();
    const fresh = await import('../../../apps/web/lib/payments/stripe');
    expect(fresh.stripeConfigured()).toBe(true);
  });

  it('MEMBERSHIP_TIERS define PREMIUM, SCOUT y CLUB con precio', () => {
    expect(stripe.MEMBERSHIP_TIERS.PREMIUM.priceCents).toBe(9900);
    expect(stripe.MEMBERSHIP_TIERS.SCOUT.priceCents).toBe(19900);
    expect(stripe.MEMBERSHIP_TIERS.CLUB.priceCents).toBe(49900);
  });

  it('verifyWebhookSignature acepta una firma válida', () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    const header = signatureHeader('1700000000', payload);
    expect(stripe.verifyWebhookSignature(payload, header)).toBe(true);
  });

  it('verifyWebhookSignature rechaza un body alterado', () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    const header = signatureHeader('1700000000', payload);
    expect(stripe.verifyWebhookSignature('{"tampered":true}', header)).toBe(false);
  });

  it('verifyWebhookSignature rechaza sin cabecera', () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    expect(stripe.verifyWebhookSignature(payload, null)).toBe(false);
  });

  it('verifyWebhookSignature rechaza con secreto distinto', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    const header = signatureHeader('1700000000', payload, 'whsec_otro_secreto');
    expect(stripe.verifyWebhookSignature(payload, header)).toBe(false);
  });

  it('verifyWebhookSignature rechaza sin secreto configurado', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.resetModules();
    const fresh = await import('../../../apps/web/lib/payments/stripe');
    const payload = JSON.stringify({ type: 'checkout.session.completed' });
    const header = signatureHeader('1700000000', payload);
    expect(fresh.verifyWebhookSignature(payload, header)).toBe(false);
  });
});
