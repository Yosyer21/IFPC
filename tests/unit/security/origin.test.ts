import { describe, expect, it } from 'vitest';
import { isSameOrigin } from '@/lib/api/respond';

function request(headers: Record<string, string>): Request {
  return new Request('https://app.example.com/api/test', { method: 'POST', headers });
}

describe('isSameOrigin', () => {
  it('acepta el mismo host (incluido proxy)', () => {
    expect(isSameOrigin(request({ origin: 'https://app.example.com', host: 'app.example.com' }))).toBe(
      true
    );
    expect(
      isSameOrigin(
        request({
          origin: 'https://app.example.com',
          host: 'internal:3000',
          'x-forwarded-host': 'app.example.com',
        })
      )
    ).toBe(true);
  });

  it('rechaza orígenes de otro dominio', () => {
    expect(isSameOrigin(request({ origin: 'https://evil.example', host: 'app.example.com' }))).toBe(
      false
    );
  });

  it('permite clientes sin Origin (no adjuntan cookies cross-site)', () => {
    expect(isSameOrigin(request({ host: 'app.example.com' }))).toBe(true);
  });
});
