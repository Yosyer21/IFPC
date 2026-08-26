import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema, playerProfileSchema } from '@ifpc/validation';

describe('registerSchema', () => {
  it('accepts valid data', () => {
    const result = registerSchema.safeParse({
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'no-es-un-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@test.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('acepta credenciales completas', () => {
    const result = loginSchema.safeParse({ email: 'ana@test.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty credentials', () => {
    const result = loginSchema.safeParse({ email: 'ana@test.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('playerProfileSchema', () => {
  it('acepta valores opcionales null', () => {
    const result = playerProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      heightCm: null,
      weightKg: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza altura negativa', () => {
    const result = playerProfileSchema.safeParse({ firstName: 'Ana', lastName: 'G', heightCm: -5 });
    expect(result.success).toBe(false);
  });
});
