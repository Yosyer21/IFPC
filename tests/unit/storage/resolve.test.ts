import { describe, expect, it, vi } from 'vitest';
import { resolveStorage, s3SettingsFromEnv } from '@/lib/storage';

describe('resolveStorage', () => {
  it('sin configuración usa el disco', () => {
    expect(resolveStorage({}).kind).toBe('local');
  });

  it('con `STORAGE_DRIVER=s3` y configuración completa usa S3', () => {
    const driver = resolveStorage({
      STORAGE_DRIVER: 's3',
      S3_ENDPOINT: 'https://minio.example.com',
      S3_BUCKET: 'ifpc',
      S3_ACCESS_KEY_ID: 'clave',
      S3_SECRET_ACCESS_KEY: 'secreto',
    });

    expect(driver.kind).toBe('s3');
  });

  it('si falta configuración avisa y cae al disco', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const driver = resolveStorage({ STORAGE_DRIVER: 's3', S3_BUCKET: 'ifpc' });

    expect(driver.kind).toBe('local');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('STORAGE_DRIVER=s3'));
    warn.mockRestore();
  });

  it('un driver desconocido no cambia el comportamiento', () => {
    expect(resolveStorage({ STORAGE_DRIVER: 'ftp' }).kind).toBe('local');
  });
});

describe('s3SettingsFromEnv', () => {
  it('deriva la base pública en modo path-style (MinIO)', () => {
    expect(
      s3SettingsFromEnv({
        S3_ENDPOINT: 'https://minio.example.com/',
        S3_BUCKET: 'ifpc',
        S3_ACCESS_KEY_ID: 'clave',
        S3_SECRET_ACCESS_KEY: 'secreto',
      })
    ).toEqual({
      endpoint: 'https://minio.example.com',
      region: 'us-east-1',
      bucket: 'ifpc',
      accessKeyId: 'clave',
      secretAccessKey: 'secreto',
      publicBaseUrl: 'https://minio.example.com/ifpc',
      forcePathStyle: true,
    });
  });

  it('admite modo virtual-hosted (AWS) y CDN aparte', () => {
    const settings = s3SettingsFromEnv({
      S3_ENDPOINT: 'https://s3.amazonaws.com',
      S3_BUCKET: 'ifpc',
      S3_ACCESS_KEY_ID: 'clave',
      S3_SECRET_ACCESS_KEY: 'secreto',
      S3_FORCE_PATH_STYLE: 'false',
      S3_PUBLIC_BASE_URL: 'https://cdn.ifpc.example',
    });

    expect(settings?.forcePathStyle).toBe(false);
    expect(settings?.publicBaseUrl).toBe('https://cdn.ifpc.example');
  });

  it('sin credenciales devuelve null', () => {
    expect(s3SettingsFromEnv({ S3_ENDPOINT: 'https://s3.amazonaws.com' })).toBeNull();
  });
});
