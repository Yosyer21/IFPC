import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadRemoteAvatar } from '@/lib/signup';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('downloadRemoteAvatar', () => {
  it('rechaza hosts no permitidos sin hacer fetch (anti-SSRF)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await downloadRemoteAvatar('https://evil.example/avatar.png')).toBeNull();
    expect(await downloadRemoteAvatar('http://lh3.googleusercontent.com/avatar.png')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignora URLs vacías o inválidas', async () => {
    expect(await downloadRemoteAvatar(null)).toBeNull();
    expect(await downloadRemoteAvatar('')).toBeNull();
    expect(await downloadRemoteAvatar('not-a-url')).toBeNull();
  });
});
