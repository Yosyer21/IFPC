import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema, playerProfileSchema } from '@ifpc/validation';

describe('registerSchema', () => {
  it('acepta datos válidos', () => {
    const result = registerSchema.safeParse({
      name: 'Ana García',
      email: 'ana@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un email inválido', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'no-es-un-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una contraseña corta', () => {
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

  it('rechaza credenciales vacías', () => {
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
