import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type * as ResendModule from '../../../apps/web/lib/email/resend';

let email: typeof ResendModule;

beforeEach(async () => {
  vi.resetModules();
  process.env.RESEND_API_KEY = 're_cambiar';
  email = await import('../../../apps/web/lib/email/resend');
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

describe('lib/email/resend', () => {
  it('sendEmail without an API key does not call fetch and warns', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await email.sendEmail({
      to: 'test@ifpc.com',
      subject: 'Test',
      html: '<p>hola</p>',
      text: 'hola',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Resend not configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sendPasswordResetEmail returns the same warning in dev', async () => {
    const result = await email.sendPasswordResetEmail(
      'test@ifpc.com',
      'http://localhost:3000/reset-password?token=abc'
    );
    expect(result.ok).toBe(false);
  });

  it('sendVerificationEmail devuelve el mismo aviso en dev', async () => {
    const result = await email.sendVerificationEmail(
      'test@ifpc.com',
      'http://localhost:3000/verify-email?token=abc'
    );
    expect(result.ok).toBe(false);
  });

  it('sendEmail con key real hace fetch a Resend', async () => {
    process.env.RESEND_API_KEY = 're_real_key';
    vi.resetModules();
    const fresh = await import('../../../apps/web/lib/email/resend');
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'mail_123' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fresh.sendEmail({
      to: 'test@ifpc.com',
      subject: 'Test',
      html: '<p>hola</p>',
    });
    expect(result.ok).toBe(true);
    expect(result.id).toBe('mail_123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
    vi.unstubAllGlobals();
  });
});
